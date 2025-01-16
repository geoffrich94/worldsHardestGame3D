import * as THREE from "three"; // This will now be resolved by the import map
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();

// Camera Element
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4.61, 2.74, 8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

// Box Class with additional properties
class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = "#00ff00",
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color })
    );

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.005;

    this.zAcceleration = zAcceleration;
  }

  updateSides() {
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  // Update positions and velocities in render loop
  update(ground) {
    this.updateSides();

    if (this.zAcceleration === true) {
      this.position.z += 0.05;
    }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    // Collision detection when box hits ground
    if (
      boxCollision({
        box1: this,
        box2: ground,
      })
    ) {
      const friction = 0.5;
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}

const boxCollision = ({ box1, box2 }) => {
  // Collision detection
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;

  return xCollision && yCollision && zCollision;
};

// Cube Element
const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: {
    x: 0,
    y: -0.01,
    z: 0,
  },
});
cube.castShadow = true;
scene.add(cube);

// Ground Element
const ground = new Box({
  width: 9,
  height: 0.5,
  depth: 50,
  color: "#0369a1",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});
ground.receiveShadow = true;
scene.add(ground);

// Directional Light Element
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true;
scene.add(light);

// Ambient Light Element
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Starfield
const generateStarfield = (numStars, minRange, maxRange) => {
  const stars = [];

  for (let i = 0; i < numStars; i++) {
    const star = new THREE.Vector3(
      Math.random() * (maxRange - minRange) + minRange,
      Math.random() * (maxRange - minRange) + minRange,
      Math.random() * (maxRange - minRange) + minRange
    );

    if (isNaN(star.x) || isNaN(star.y) || isNaN(star.z)) {
      console.warn("Skipping star with NaN values:", star);
      continue;
    }

    stars.push(star);
  }

  return stars;
};

const NUM_STARS = 6000;
const MIN_RANGE = -300;
const MAX_RANGE = 300;

const starGeo = new THREE.BufferGeometry();
const stars = generateStarfield(NUM_STARS, MIN_RANGE, MAX_RANGE);

// Create the position buffer attribute from the stars
starGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array(stars.flatMap((v) => [v.x, v.y, v.z])),
    3
  )
);

// Create a velocity buffer attribute with random velocities for each star
const velocities = [];
for (let i = 0; i < stars.length; i++) {
  velocities.push(0, 0, (Math.random() - 0.5) * 5);
}
starGeo.setAttribute(
  "velocity",
  new THREE.BufferAttribute(new Float32Array(velocities), 3)
);

const sprite = new THREE.TextureLoader().load("/textures/star.png");
const starMaterial = new THREE.PointsMaterial({
  color: 0xaaaaaa,
  size: 0.7,
  map: sprite,
});
const starField = new THREE.Points(starGeo, starMaterial);
scene.add(starField);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    presssed: false,
  },
  w: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
};

// Track whether a key is pressed down
window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyA":
      console.log("Pressed A!");
      keys.a.pressed = true;
      break;
    case "KeyD":
      console.log("Pressed D!");
      keys.d.pressed = true;
      break;
    case "KeyW":
      console.log("Pressed W!");
      keys.w.pressed = true;
      break;
    case "KeyS":
      console.log("Pressed S!");
      keys.s.pressed = true;
      break;
    case "Space":
      cube.velocity.y = 0.15;
      break;
  }
});

// Track whether a key is released
window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyA":
      console.log("Released A!");
      keys.a.pressed = false;
      break;
    case "KeyD":
      console.log("Released D!");
      keys.d.pressed = false;
      break;
    case "KeyS":
      console.log("Released S!");
      keys.s.pressed = false;
      break;
    case "KeyW":
      console.log("Released W!");
      keys.w.pressed = false;
      break;
  }
});

const enemies = [];

// Frame index
let frames = 0;

// Enemy Spawn Rate
let enemySpawnRate = 100;

// Render loop function
const animate = () => {
  const animationdId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Movement
  cube.velocity.x = 0;
  cube.velocity.z = 0;
  if (keys.a.pressed === true) {
    cube.velocity.x = -0.05;
  } else if (keys.d.pressed === true) {
    cube.velocity.x = 0.05;
  }
  if (keys.s.pressed === true) {
    cube.velocity.z = 0.05;
  } else if (keys.w.pressed === true) {
    cube.velocity.z = -0.05;
  }

  cube.update(ground);
  enemies.forEach((enemy) => {
    enemy.update(ground);
    if (boxCollision({ box1: cube, box2: enemy })) {
      console.log("Enemy Collision !");
      window.cancelAnimationFrame(animationdId);
    }
  });

  // Spawn new enemy
  if (frames % enemySpawnRate === 0) {
    // Increase spawn rate and difficulty
    if (enemySpawnRate > 20) {
      enemySpawnRate -= 20;
    }

    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: {
        x: (Math.random() - 0.5) * 8.5,
        y: 0,
        z: -20,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.01,
      },
      color: "#ff0000",
      zAcceleration: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  frames++;

  // Update the positions of the stars based on their velocities
  const positions = starField.geometry.attributes.position.array;
  const velocities = starField.geometry.attributes.velocity.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
  }
  starField.geometry.attributes.position.needsUpdate = true;
};
animate();
