World = function(camera) {
  this.cells_ = new Uint8Array(World.TOTAL_SIZE);

  this.root_ = new THREE.Object3D();
  this.root_.position.x = -World.X_SIZE / 2;
  this.root_.position.z = -World.Z_SIZE / 2;
  
  this.camera_ = camera;
};

World.X_SIZE = 50;
World.Y_SIZE = 20;
World.Z_SIZE = 50;

World.TOTAL_SIZE = World.X_SIZE * World.Y_SIZE * World.Z_SIZE;

World.Y_OFFSET = World.X_SIZE;
World.Z_OFFSET = World.X_SIZE * World.Y_SIZE;

World.CELL_TX_SIZE = 1 / 4;
World.CELL_TY_SIZE = 1 / 2;

World.CellType = {
  EMPTY: 0,
  UNKNOWN: 1,
  DIRT: 2,
  ROCK: 3,
  WATER: 4,
  WOOD: 5
};

World.CELL_TX_OFFSET = [
  (World.CELL_TX_SIZE * 3),  // EMPTY
  (World.CELL_TX_SIZE * 1),  // UNKNOWN
  (World.CELL_TX_SIZE * 0),  // DIRT
  (World.CELL_TX_SIZE * 1),  // ROCK
  (World.CELL_TX_SIZE * 2),  // WATER
  (World.CELL_TX_SIZE * 0)   // WOOD
];

World.CELL_TY_OFFSET = [
  (World.CELL_TY_SIZE * 0),  // EMPTY
  (World.CELL_TY_SIZE * 0),  // UNKNOWN
  (World.CELL_TY_SIZE * 1),  // DIRT
  (World.CELL_TY_SIZE * 1),  // ROCK
  (World.CELL_TY_SIZE * 0),  // WATER
  (World.CELL_TY_SIZE * 0)   // WOOD
];

World.FACES = [
  [0, 2, 1, 3],
  [1, 6, 5, 2],
  [5, 7, 4, 6],
  [4, 3, 0, 7],
  [3, 6, 2, 7],
  [1, 4, 0, 5]
];

World.NEXT_OFFSET = [
  [0, 0, -1],
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0]
];

World.isIn = function(x, y, z) {
  return x >= 0 && y >= 0 && z >= 0 &&
      x < World.X_SIZE && y < World.Y_SIZE && z < World.Z_SIZE;
};


/**
 * @private
 */
World.isTransparent_ = function(cellType) {
  return cellType == World.CellType.EMPTY ||
      cellType == World.CellType.WATER;
};


World.prototype.init = function() {
  this.createRandomWorld_();
  this.buildMesh_();
  this.moveCamera_();
};


World.prototype.getRoot = function() {
  return this.root_;
};


/**
 * @private
 */
World.prototype.createRandomWorld_ = function() {
  for (var i = 0; i < World.TOTAL_SIZE; ++i) {
    this.cells_[i] = World.EMPTY;
  }
  var height = World.Y_SIZE / 2;
  for (var i = 0; i < World.X_SIZE; ++i) {
    for (var j = 0; j < World.Z_SIZE; ++j) {
      height += Math.floor(Math.random() * 2) * 2 - 1;
      height = Math.max(0, Math.min(height, World.Y_SIZE - 1));
      var cellType = Math.floor(Math.random() * 4) + 2;
      for (var k = 0; k <= height; ++k) {
        this.setCell(i, k, ((i & 1) ? j : (World.Z_SIZE - j - 1)), cellType);
      }
    }
  }
};

/**
 * @private
 */
World.prototype.buildMesh_ = function() {
  var geo = new THREE.Geometry();
  var vi = 0;
  for (var i = 0; i < World.TOTAL_SIZE; ++i) {
    var cellType = this.cells_[i];
    if (!cellType || cellType == World.CellType.EMPTY) {
      continue;
    }
    
    var x = i % World.X_SIZE;
    var y = Math.floor(i / World.Y_OFFSET) % World.Y_SIZE;
    var z = Math.floor(i / World.Z_OFFSET) % World.Z_SIZE;
    
    var tx = World.CELL_TX_OFFSET[cellType];
    var ty = World.CELL_TY_OFFSET[cellType];

    var materialIndex = World.isTransparent_(cellType) ? 1 : 0;

    var addedFace = false; 
    for (var j = 0; j < 6; ++j) {
      var norm = World.NEXT_OFFSET[j];
      var nextCell = this.getCell(
        x + norm[0],
        y + norm[1],
        z + norm[2]
      );
      if (nextCell != cellType && World.isTransparent_(nextCell)) {
        addedFace = true;
        var f = World.FACES[j];

        var face = new THREE.Face3(vi+f[0], vi+f[1], vi+f[2]);
        face.normal.set(norm[0], norm[1], norm[2]);
        face.materialIndex = materialIndex;
        geo.faces.push(face);

        face = new THREE.Face3(vi+f[0], vi+f[3], vi+f[1]);
        face.normal.set(norm[0], norm[1], norm[2]);
        face.materialIndex = materialIndex;
        geo.faces.push(face);

        geo.faceVertexUvs[0].push([
          new THREE.Vector2(tx, ty),
          new THREE.Vector2(tx + World.CELL_TX_SIZE, ty + World.CELL_TY_SIZE),
          new THREE.Vector2(tx + World.CELL_TX_SIZE, ty)
        ], [
          new THREE.Vector2(tx, ty),
          new THREE.Vector2(tx, ty + World.CELL_TY_SIZE),
          new THREE.Vector2(tx + World.CELL_TX_SIZE, ty + World.CELL_TY_SIZE)
        ]);
      }
    }
    if (addedFace) {
      geo.vertices.push(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x + 1, y, z),
        new THREE.Vector3(x + 1, y + 1, z),
        new THREE.Vector3(x, y + 1, z),
        new THREE.Vector3(x, y, z + 1),
        new THREE.Vector3(x + 1, y, z + 1),
        new THREE.Vector3(x + 1, y + 1, z + 1),
        new THREE.Vector3(x, y + 1, z + 1)
      );
      vi += 8;
    }
  }
  geo.mergeVertices();
  geo.computeVertexNormals();
  // geo.computeFaceNormals();
  var materials = [
    Materials.getMaterial(Materials.SOLID_CELLS),
    Materials.getMaterial(Materials.TRANSPARENT_CELLS)
  ];
  var mesh = new THREE.Mesh(geo, new THREE.MeshFaceMaterial(materials));
  this.root_.add(mesh);
};


/**
 * @private
 */
World.prototype.moveCamera_ = function() {
  //  this.camera.position = new THREE.Vector3(0.5, 0.5);
};


World.prototype.getCell = function(x, y, z) {
  if (!World.isIn(x, y, z)) {
    return World.CellType.EMPTY;
  }
  return this.cells_[x + y * World.Y_OFFSET + z * World.Z_OFFSET];
};

/**
 * @private
 */
World.prototype.getCellById_ = function(id) {
  if (id < 0 || id >= World.TOTAL_SIZE) {
    return World.CellType.EMPTY;
  }
  return this.cells_[id];
};


World.prototype.setCell = function(x, y, z, cell) {
  if (!World.isIn(x, y, z)) {
    // TODO(hru): log error
    return;
  }
  this.cells_[x + y * World.Y_OFFSET + z * World.Z_OFFSET] = cell;
};

World.prototype.update = function(dt) {

};