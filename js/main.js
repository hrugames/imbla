Main = function() {
  // Hello there
};

Main.prototype.init = function() {
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( this.renderer.domElement );
  
  
  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  this.camera.position.z = 400;
  
  this.scene = new THREE.Scene();
  
  var geometry = new THREE.BoxGeometry(200, 200, 200);
  
  var texture = THREE.ImageUtils.loadTexture('textures/crate.gif');
  texture.anisotropy = this.renderer.getMaxAnisotropy();
  
  var material = new THREE.MeshBasicMaterial({ map: texture });
  
  this.mesh = new THREE.Mesh(geometry, material);
  this.scene.add(this.mesh);

  this.animate();

  window.addEventListener('resize', $.bind(this.onWindowResize, this), false);
};

  
Main.prototype.onWindowResize = function() {
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
    
  this.renderer.setSize( window.innerWidth, window.innerHeight );
};
  
Main.prototype.animate = function() {
  requestAnimationFrame($.bind(this.animate, this));
  
  this.mesh.rotation.x += 0.005;
  this.mesh.rotation.y += 0.01;
  
  this.renderer.render(this.scene, this.camera);
};
  
(function() {
  var m = new Main();
  m.init();
})();