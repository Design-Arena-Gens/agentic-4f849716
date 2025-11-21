import * as THREE from 'three';

let scene, camera, renderer, characters = [], animationId;
let cameraAngle = 0;
let battlePhase = 0;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 2, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const redLight = new THREE.PointLight(0xff0000, 2, 20);
    redLight.position.set(-5, 3, 0);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x0088ff, 2, 20);
    blueLight.position.set(5, 3, 0);
    scene.add(blueLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3e,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid pattern
    const gridHelper = new THREE.GridHelper(50, 50, 0x444466, 0x333344);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Create characters
    createCharacters();

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            cameraAngle += deltaX * 0.01;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(10, Math.min(35, camera.position.z));
    });

    // Restart button
    document.getElementById('restart-btn').addEventListener('click', () => {
        characters.forEach(char => scene.remove(char.group));
        characters = [];
        battlePhase = 0;
        createCharacters();
        updateStatus('Battle Restarted!');
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function createCharacter(type, position, color, name) {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = type === 'killer'
        ? new THREE.ConeGeometry(0.4, 0.8, 6)
        : new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: type === 'killer' ? 0x000000 : color,
        roughness: 0.2,
        metalness: 0.8
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.4;
    if (type === 'killer') head.rotation.y = Math.PI / 6;
    head.castShadow = true;
    group.add(head);

    // Armor shoulders
    if (type === 'warrior') {
        const shoulderGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const shoulderMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.2,
            metalness: 0.9
        });
        const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        leftShoulder.position.set(-0.7, 2.8, 0);
        leftShoulder.castShadow = true;
        group.add(leftShoulder);

        const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        rightShoulder.position.set(0.7, 2.8, 0);
        rightShoulder.castShadow = true;
        group.add(rightShoulder);

        // Armor plates
        const plateGeometry = new THREE.BoxGeometry(1.1, 0.3, 0.7);
        const plate1 = new THREE.Mesh(plateGeometry, shoulderMaterial);
        plate1.position.y = 2.3;
        plate1.castShadow = true;
        group.add(plate1);

        const plate2 = new THREE.Mesh(plateGeometry, shoulderMaterial);
        plate2.position.y = 1.7;
        plate2.castShadow = true;
        group.add(plate2);
    }

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: type === 'killer' ? 0x1a1a1a : color,
        roughness: 0.4,
        metalness: 0.6
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 2, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 2, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.18, 0.18, 1.8);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: type === 'killer' ? 0x2a2a2a : color,
        roughness: 0.5,
        metalness: 0.5
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.9, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.9, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Sword
    const swordGroup = new THREE.Group();
    const bladeGeometry = new THREE.BoxGeometry(0.1, 3, 0.15);
    const bladeMaterial = new THREE.MeshStandardMaterial({
        color: type === 'killer' ? 0xff0000 : 0xcccccc,
        roughness: 0.1,
        metalness: 1,
        emissive: type === 'killer' ? 0x440000 : 0x000000,
        emissiveIntensity: type === 'killer' ? 0.5 : 0
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 1.5;
    blade.castShadow = true;
    swordGroup.add(blade);

    const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    swordGroup.add(handle);

    const guardGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.15);
    const guard = new THREE.Mesh(guardGeometry, handleMaterial);
    guard.position.y = 0.3;
    swordGroup.add(guard);

    swordGroup.position.set(type === 'killer' ? 0.8 : -0.8, 2, 0);
    swordGroup.rotation.z = type === 'killer' ? -0.5 : 0.5;
    group.add(swordGroup);

    group.position.set(position.x, position.y, position.z);
    scene.add(group);

    return {
        group,
        type,
        name,
        body,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        sword: swordGroup,
        health: 100,
        targetPos: null,
        velocity: new THREE.Vector3(),
        rotation: 0
    };
}

function createCharacters() {
    // Legacy Killer
    characters.push(createCharacter('killer', { x: 0, y: 0, z: 5 }, 0xff1744, 'Legacy Killer'));

    // Three Warriors with unique armor colors
    characters.push(createCharacter('warrior', { x: -4, y: 0, z: -5 }, 0x2196f3, 'Warrior 1'));
    characters.push(createCharacter('warrior', { x: 0, y: 0, z: -7 }, 0x4caf50, 'Warrior 2'));
    characters.push(createCharacter('warrior', { x: 4, y: 0, z: -5 }, 0xff9800, 'Warrior 3'));
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

function animate() {
    animationId = requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Update camera position
    const radius = 20;
    camera.position.x = Math.sin(cameraAngle) * radius;
    camera.position.z = Math.cos(cameraAngle) * radius;
    camera.lookAt(0, 2, 0);

    // Animate characters
    characters.forEach((char, index) => {
        if (char.health <= 0) {
            char.group.rotation.x = Math.min(char.group.rotation.x + 0.02, Math.PI / 2);
            char.group.position.y = Math.max(char.group.position.y - 0.02, -1);
            return;
        }

        // Breathing animation
        char.body.scale.y = 1 + Math.sin(time * 2 + index) * 0.05;

        // Combat animations
        if (battlePhase < 300) {
            // Approach phase
            if (char.type === 'killer') {
                char.group.position.z -= 0.02;
                char.group.rotation.y = 0;
            } else {
                char.group.position.z += 0.015;
                char.group.rotation.y = Math.PI;
            }

            // Walking animation
            char.leftLeg.rotation.x = Math.sin(time * 8 + index) * 0.3;
            char.rightLeg.rotation.x = Math.sin(time * 8 + index + Math.PI) * 0.3;
            char.leftArm.rotation.x = Math.sin(time * 8 + index + Math.PI) * 0.2;
            char.rightArm.rotation.x = Math.sin(time * 8 + index) * 0.2;

        } else {
            // Battle phase
            const attackSpeed = char.type === 'killer' ? 10 : 6;
            const attackPhase = Math.sin(time * attackSpeed + index * 2);

            if (attackPhase > 0.7) {
                // Attack animation
                char.sword.rotation.z = char.type === 'killer'
                    ? -0.5 - attackPhase * 2
                    : 0.5 + attackPhase * 2;

                char.rightArm.rotation.x = char.type === 'killer' ? -attackPhase * 2 : attackPhase * 2;

                // Damage opponents
                if (attackPhase > 0.95) {
                    characters.forEach((target, targetIndex) => {
                        if (targetIndex !== index && target.health > 0 && target.type !== char.type) {
                            const distance = char.group.position.distanceTo(target.group.position);
                            if (distance < 4) {
                                target.health -= char.type === 'killer' ? 0.8 : 0.3;

                                // Knockback
                                const direction = new THREE.Vector3()
                                    .subVectors(target.group.position, char.group.position)
                                    .normalize();
                                target.group.position.add(direction.multiplyScalar(0.1));
                            }
                        }
                    });
                }
            } else {
                // Reset sword position
                char.sword.rotation.z = char.type === 'killer' ? -0.5 : 0.5;
                char.rightArm.rotation.x = 0;
            }

            // Strafe movement
            char.group.position.x += Math.sin(time * 2 + index) * 0.03;
            char.group.position.z += Math.cos(time * 2 + index) * 0.02;

            // Keep characters in arena
            char.group.position.x = Math.max(-8, Math.min(8, char.group.position.x));
            char.group.position.z = Math.max(-8, Math.min(8, char.group.position.z));

            // Face opponents
            if (char.type === 'killer') {
                const warrior = characters.find(c => c.type === 'warrior' && c.health > 0);
                if (warrior) {
                    const angle = Math.atan2(
                        warrior.group.position.x - char.group.position.x,
                        warrior.group.position.z - char.group.position.z
                    );
                    char.group.rotation.y = angle;
                }
            } else {
                const killer = characters[0];
                if (killer.health > 0) {
                    const angle = Math.atan2(
                        killer.group.position.x - char.group.position.x,
                        killer.group.position.z - char.group.position.z
                    );
                    char.group.rotation.y = angle;
                }
            }
        }
    });

    battlePhase++;

    // Check battle status
    const killer = characters[0];
    const warriorsAlive = characters.filter(c => c.type === 'warrior' && c.health > 0).length;

    if (killer.health <= 0 && battlePhase % 60 === 0) {
        updateStatus('Warriors Victory!');
    } else if (warriorsAlive === 0 && battlePhase % 60 === 0) {
        updateStatus('Legacy Killer Wins!');
    } else if (battlePhase < 300) {
        updateStatus('Warriors Approaching...');
    } else if (battlePhase === 300) {
        updateStatus('Battle Begins!');
    }

    renderer.render(scene, camera);
}

init();
