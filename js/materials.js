Materials = function() {
  
};

Materials.ERROR = 0;
Materials.SOLID_CELLS = 1;
Materials.TRANSPARENT_CELLS = 2;

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
    case Materials.SOLID_CELLS:
      return new THREE.MeshLambertMaterial({
        map: Materials.loadTexture_('textures/cell_pack.png'),
        ambient: 0xbbbbbb
      });
    case Materials.TRANSPARENT_CELLS:
      return new THREE.MeshLambertMaterial({
        map: Materials.loadTexture_('textures/cell_pack.png'),
        ambient: 0xbbbbbb,
        transparent:true
      });
  }
  return new THREE.MeshLambertMaterial({
    map: Materials.loadTexture_('textures/error.png'),
    ambient: 0xbbbbbb
  });
};

Materials.loadTexture_ = function(fn) {
  var texture = THREE.ImageUtils.loadTexture(fn);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  return texture;
};
