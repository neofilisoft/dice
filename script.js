// ============================================================
//  Neofilisoft Dice Roller — script.js
//  Supports: D8 (Octahedron), D12 (Dodecahedron), D20 (Icosahedron)
//  Multi-dice: 1, 2, or 3 dice with staggered SFX
// ============================================================

// --- Audio ---
function makeRollSound() {
    const s = new Audio('sfx/roll.mp3');
    s.preload = 'auto';
    s.load();
    return s;
}
// Pool of 3 audio instances to allow overlapping staggered plays
const rollSounds = [makeRollSound(), makeRollSound(), makeRollSound()];

// --- State ---
let currentDiceType = 'd20';  // 'd8' | 'd12' | 'd20'
let currentDiceCount = 1;     // 1 | 2 | 3
let isRolling = false;

// --- Three.js Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 0.7), 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
document.getElementById('dice-container').appendChild(renderer.domElement);

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x606060));

const rimLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
rimLight.position.set(-5, -3, -5);
scene.add(rimLight);

camera.position.z = 7;

// --- Dice config ---
function makeD100Geometry(radius = 2) {
    // WidthSegments=10, HeightSegments=5 → roughly spherical, visually matches real d100
    return new THREE.SphereGeometry(radius, 10, 5);
}

// Returns exactly 10 evenly-distributed face normals on a sphere surface
// for label placement — arranged in 2 rings of 5, alternating like a d10
function getD100FaceVectors() {
    const normals = [];
    // Upper ring of 5 (φ = 60° from top)
    for (let i = 0; i < 5; i++) {
        const phi   = Math.PI * 0.33;
        const theta = (i / 5) * Math.PI * 2;
        normals.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        ).normalize());
    }
    // Lower ring of 5 (φ = 120° from top), offset by 36°
    for (let i = 0; i < 5; i++) {
        const phi   = Math.PI * 0.67;
        const theta = ((i + 0.5) / 5) * Math.PI * 2;
        normals.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        ).normalize());
    }
    return normals;
}

const DICE_CONFIG = {
    d8:   { faces: 8,   sides: 8,   color: 0x1a3a5c, geo: () => new THREE.OctahedronGeometry(2, 0) },
    d12:  { faces: 12,  sides: 12,  color: 0x2d5a1b, geo: () => new THREE.DodecahedronGeometry(2, 0) },
    d20:  { faces: 20,  sides: 20,  color: 0x591723,  geo: () => new THREE.IcosahedronGeometry(2, 0) },
    // D100 = percentile dice: sphere body, 10 label positions (tens die)
    // units digit rolled separately in result handler
    d100: { faces: 10,  sides: 100, color: 0x4a1a6b,  geo: () => makeD100Geometry(2),
            isPercentile: true,
            labelFn: (i) => i === 9 ? '00' : String(i * 10).padStart(2, '0'),
            getFaceVectors: () => getD100FaceVectors(),
        },
};

// Horizontal positions for 1–5 dice
const POSITIONS = {
    1: [[0, 0, 0]],
    2: [[-2.5, 0, 0], [2.5, 0, 0]],
    3: [[-4.2, 0, 0], [0, 0, 0], [4.2, 0, 0]],
    // 4 dice: one in each corner
    4: [[-4.2, 2.8, 0], [4.2, 2.8, 0], [-4.2, -2.8, 0], [4.2, -2.8, 0]],
    // 5 dice: top row of 3, bottom row of 2 centered
    5: [[-4.2, 2.8, 0], [0, 2.8, 0], [4.2, 2.8, 0], [-2.5, -2.8, 0], [2.5, -2.8, 0]],
};

// Camera Z per count
const CAM_Z = { 1: 7, 2: 9, 3: 12, 4: 14, 5: 14 };

// --- Active dice meshes ---
let diceObjects = []; // [{mesh, faceVectors, targetQuat, rolling, rollVel}]

function clearDice() {
    diceObjects.forEach(d => scene.remove(d.mesh));
    diceObjects = [];
}

function buildDice(type, count) {
    clearDice();
    const cfg = DICE_CONFIG[type];
    const positions = POSITIONS[count];
    camera.position.z = CAM_Z[count];

    for (let i = 0; i < count; i++) {
        const geometry = cfg.geo();
        const material = new THREE.MeshPhongMaterial({
            color: cfg.color,
            flatShading: true,
            shininess: 60,
        });
        const mesh = new THREE.Mesh(geometry, material);

        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.5 })
        );
        mesh.add(wireframe);

        const [x, y, z] = positions[i];
        mesh.position.set(x, y, z);

        // Slight random initial rotation so dice don't overlap perfectly
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        scene.add(mesh);

        const faceVectors = cfg.getFaceVectors ? cfg.getFaceVectors() : computeFaceVectors(geometry);
        const targetQuat = new THREE.Quaternion();
        targetQuat.copy(mesh.quaternion);

        diceObjects.push({
            mesh,
            faceVectors,
            targetQuat,
            rolling: false,
            rollVelX: 0,
            rollVelY: 0,
        });
    }
}

function computeFaceVectors(geometry) {
    if (!geometry.index) {
        const positions = geometry.attributes.position.array;
        const indices = [];
        for (let i = 0; i < positions.length / 3; i++) indices.push(i);
        geometry.setIndex(indices);
    }

    const posAttr = geometry.attributes.position;
    const idxAttr = geometry.index;
    const triangleCount = idxAttr.count / 3;
    const uniqueNormals = [];

    for (let i = 0; i < triangleCount; i++) {
        const a = idxAttr.getX(i * 3);
        const b = idxAttr.getX(i * 3 + 1);
        const c = idxAttr.getX(i * 3 + 2);

        const vA = new THREE.Vector3().fromBufferAttribute(posAttr, a);
        const vB = new THREE.Vector3().fromBufferAttribute(posAttr, b);
        const vC = new THREE.Vector3().fromBufferAttribute(posAttr, c);

        const cb = new THREE.Vector3().subVectors(vC, vB);
        const ab = new THREE.Vector3().subVectors(vA, vB);
        const normal = cb.cross(ab).normalize();

        const isDuplicate = uniqueNormals.some(n => n.angleTo(normal) < 0.1);

        if (!isDuplicate) {
            uniqueNormals.push(normal);
        }
    }
    return uniqueNormals; 
}

function addNumbersToDice(diceObj) {
    const { mesh, faceVectors } = diceObj;

    let dist = 1.65;
    if (currentDiceType === 'd8') dist = 1.16;
    else if (currentDiceType === 'd12') dist = 1.60;
    else if (currentDiceType === 'd100') dist = 2.05;
    
    const cfg = DICE_CONFIG[currentDiceType];

    for (let i = 0; i < faceVectors.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = 'white';
        ctx.font = cfg.isPercentile ? 'bold 58px Arial' : 'bold 78px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = cfg.labelFn ? cfg.labelFn(i) : String(i + 1);
        ctx.fillText(label, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const planeGeom = new THREE.PlaneGeometry(0.7, 0.7);
        const planeMat = new THREE.MeshBasicMaterial({
            map: texture, transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide, depthTest: true
        });
        const labelMesh = new THREE.Mesh(planeGeom, planeMat);

        const dir = faceVectors[i].clone().normalize();
        labelMesh.position.copy(dir.clone().multiplyScalar(dist));
        // lookAt world origin from label position (which is in mesh-local space)
        labelMesh.lookAt(new THREE.Vector3(0, 0, 0).sub(dir));
        // flip 180° so text faces outward not inward
        labelMesh.rotateY(Math.PI);
        mesh.add(labelMesh);
    }
}

// --- Animation loop ---
function animate() {
    requestAnimationFrame(animate);
    diceObjects.forEach(d => {
        if (d.rolling) {
            // Apply velocity with slight damping — gives a decelerating tumble feel
            d.rollVelX *= 0.97;
            d.rollVelY *= 0.97;
            d.mesh.rotation.x += d.rollVelX;
            d.mesh.rotation.y += d.rollVelY;
            d.mesh.quaternion.setFromEuler(d.mesh.rotation);
        } else {
            d.mesh.quaternion.slerp(d.targetQuat, 0.08);
        }
    });
    renderer.render(scene, camera);
}
animate();

// --- Roll ---
document.getElementById('rollBtn').onclick = () => {
    if (isRolling) return;
    isRolling = true;

    const resultDisplay = document.getElementById('result-display');
    const breakdown = document.getElementById('result-breakdown');
    resultDisplay.innerText = '...';
    breakdown.innerText = '';
    resultDisplay.classList.remove('pop');

    const cfg = DICE_CONFIG[currentDiceType];
    const results = [];

    // Stagger SFX: play one per dice, slightly offset
    diceObjects.forEach((d, i) => {
        d.rolling = true;
        // Random fast spin velocity for natural-looking tumble
        d.rollVelX = 0.25 + Math.random() * 0.2;
        d.rollVelY = 0.22 + Math.random() * 0.2;

        setTimeout(() => {
            const sfx = rollSounds[i % rollSounds.length];
            sfx.currentTime = 0.01;
            sfx.play().catch(() => {});
            setTimeout(() => sfx.pause(), 900);
        }, i * 180);
    });

    // After 1.2s stop rolling and show result
    setTimeout(() => {
        diceObjects.forEach((d, i) => {
            d.rolling = false;
            const result = Math.floor(Math.random() * cfg.sides) + 1;
            results.push(result);

            // Orient face to camera
            if (d.faceVectors[result - 1]) {
                const faceVec = d.faceVectors[result - 1].clone();
                const camDir = new THREE.Vector3(0, 0, 1);
                d.targetQuat.setFromUnitVectors(faceVec.normalize(), camDir);
            }
        });

        // --- D100 special display ---
        if (cfg.isPercentile) {
            const tensRoll  = Math.floor(Math.random() * 10) * 10;
            const unitsRoll = Math.floor(Math.random() * 10);
            const total     = tensRoll + unitsRoll === 0 ? 100 : tensRoll + unitsRoll;
            const tensLabel  = String(tensRoll).padStart(2, '0');
            const unitsLabel = String(unitsRoll).padStart(2, '0');
            isRolling = false;
            resultDisplay.innerText = total;
            void resultDisplay.offsetWidth;
            resultDisplay.classList.add('pop');
            setTimeout(() => resultDisplay.classList.remove('pop'), 300);
            breakdown.innerText = tensLabel + ' + ' + unitsLabel + ' = ' + total;
            return;
        }

        const total = results.reduce((a, b) => a + b, 0);
        isRolling = false;

        resultDisplay.innerText = total;
        // Pop animation
        void resultDisplay.offsetWidth;
        resultDisplay.classList.add('pop');
        setTimeout(() => resultDisplay.classList.remove('pop'), 300);

        if (results.length > 1) {
            breakdown.innerText = results.join(' + ') + ' = ' + total;
        }

    }, 1200);
};

// --- Menu functions ---
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const btn = document.getElementById('menu-toggle');
    const overlay = document.getElementById('menu-overlay');
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
    overlay.classList.toggle('show');
}
function closeMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.getElementById('menu-toggle').classList.remove('open');
    document.getElementById('menu-overlay').classList.remove('show');
}

function selectDiceType(type, el) {
    currentDiceType = type;
    document.querySelectorAll('.dice-type-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    buildDice(currentDiceType, currentDiceCount);
    diceObjects.forEach(d => addNumbersToDice(d));
    updateMenuLabel();
}

function selectDiceCount(count, el) {
    currentDiceCount = count;
    document.querySelectorAll('.dice-count-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    buildDice(currentDiceType, currentDiceCount);
    diceObjects.forEach(d => addNumbersToDice(d));
    updateMenuLabel();
}

function updateMenuLabel() {
    const label = document.getElementById('menu-selection-label');
    label.innerText = currentDiceType.toUpperCase() + ' × ' + currentDiceCount;
}

// --- Language ---
const translations = {
    th: { btnText: 'ทอยเต๋า', label: 'TH', menuHeader: 'เลือกลูกเต๋า', sectionType: 'ชนิดลูกเต๋า', sectionCount: 'จำนวนลูกเต๋า' },
    en: { btnText: 'Roll Dice', label: 'EN', menuHeader: 'Choose a dice',  sectionType: 'Types', sectionCount: 'Number of dice' },
};

// D100 note: when selected, dice count buttons still render but D100 always
// uses a single tens-die visually (the result breakdown shows tens + units separately).
function toggleLangMenu() {
    document.getElementById('lang-menu').classList.toggle('show');
}

function changeLanguage(lang) {
    const t = translations[lang];
    document.getElementById('rollBtn').innerText = t.btnText;
    document.getElementById('lang-toggle').innerText = t.label;
    document.querySelector('.menu-header').innerText = t.menuHeader;
    const sections = document.querySelectorAll('.menu-section-title');
    if (sections[0]) sections[0].innerText = t.sectionType;
    if (sections[1]) sections[1].innerText = t.sectionCount;
    document.getElementById('lang-menu').classList.remove('show');
}

window.onclick = function(event) {
    const t = event.target;
    if (!t.matches('#lang-toggle')) {
        document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('show'));
    }
};

window.onresize = () => {
    camera.aspect = window.innerWidth / (window.innerHeight * 0.7);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
};

// --- Init ---
buildDice(currentDiceType, currentDiceCount);
diceObjects.forEach(d => addNumbersToDice(d));
updateMenuLabel();
changeLanguage('en');
