Main = function() {
  // Hello there
};


Main.prototype.run = function() {
  this.init();
  this.animate();
};

Main.prototype.init = function() {
  this.clock = new THREE.Clock();
  
  this.container = document.createElement('div');
  document.body.appendChild(this.container);
  
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  this.container.appendChild(this.renderer.domElement);
  
  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  this.camera.position = new THREE.Vector3(-20, 20, 20);
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  // Controls
  
  var controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.noZoom = true;
  controls.noPan = true;
  controls.autoRotate = true;
  this.controls = controls;
  
  this.world = new World(this.camera);
  this.world.init();
  
  this.scene = new THREE.Scene();
  
  var ambientLight = new THREE.AmbientLight(0xaaaaaa);
  this.scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 0.8, 0.5).normalize();
  this.scene.add(directionalLight);

  var root = this.world.getRoot();
  this.scene.add(root);

  this.stats = new Stats();
  this.stats.domElement.style.position = 'absolute';
  this.stats.domElement.style.top = '0px';
  this.container.appendChild(this.stats.domElement);

  window.addEventListener('resize', $.bind(this.onWindowResize, this), false);
};

Main.prototype.onWindowResize = function() {
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
    
  this.renderer.setSize( window.innerWidth, window.innerHeight );
};

Main.prototype.animate = function() {
  requestAnimationFrame($.bind(this.animate, this));

  this.update(this.clock.getDelta());
  this.render(this.clock.getDelta());
};

Main.prototype.update = function(dt) {
  this.world.update(dt);
  this.stats.update();
};

Main.prototype.render = function(dt) {
  this.renderer.render(this.scene, this.camera);
};

(function() {
  var m = new Main();
  m.run();
})();