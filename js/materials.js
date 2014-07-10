Materials = function() {
  
};

Materials.ERROR = 0;
Materials.CELLS = 1;

Materials.cache_ = {};

Materials.getMaterial = function(type) {
  if (!Materials.cache_[type]) {
    Materials.cache_[type] = Materials.loadMaterial_(type);
  }
  return Materials.cache_[type];
};

Materials.loadMaterial_ = function(type) {
  var texture;
  switch (type) {
    case Materials.CELLS:
      texture = THREE.ImageUtils.loadTexture('textures/cell_pack.png');
      break;
    default:
      texture = THREE.ImageUtils.loadTexture('textures/error.png');
      break;
  }
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  return new THREE.MeshLambertMaterial({ map: texture, ambient: 0xbbbbbb });
};
