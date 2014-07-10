World = function(camera) {
  this.cells_ = new Uint8Array(World.TOTAL_SIZE);

  this.root_ = new THREE.Object3D();
  this.root_.position.x = -World.X_SIZE / 2;
  this.root_.position.z = -World.Z_SIZE / 2;
  
  this.camera_ = camera;
};

World.X_SIZE = 40;
World.Y_SIZE = 12;
World.Z_SIZE = 40;

World.TOTAL_SIZE = World.X_SIZE * World.Y_SIZE * World.Z_SIZE;

World.Y_OFFSET = World.X_SIZE;
World.Z_OFFSET = World.X_SIZE * World.Y_SIZE;

World.CELL_TX_SIZE = 1 / 4;
World.CELL_TY_SIZE = 1 / 2;

World.CellType = {
  UNKNOWN: 0,
  EMPTY: 1,
  DIRT: 2,
  ROCK: 3,
  WATER: 4,
  WOOD: 5
};

World.CELL_TX_OFFSET = [
  (World.CELL_TX_SIZE * 1),  // UNKNOWN
  (World.CELL_TX_SIZE * 3),  // EMPTY
  (World.CELL_TX_SIZE * 0),  // DIRT
  (World.CELL_TX_SIZE * 1),  // ROCK
  (World.CELL_TX_SIZE * 2),  // WATER
  (World.CELL_TX_SIZE * 0)   // WOOD
];

World.CELL_TY_OFFSET = [
  (World.CELL_TY_SIZE * 0),  // UNKNOWN
  (World.CELL_TY_SIZE * 0),  // EMPTY
  (World.CELL_TY_SIZE * 1),  // DIRT
  (World.CELL_TY_SIZE * 1),  // ROCK
  (World.CELL_TY_SIZE * 0),  // WATER
  (World.CELL_TY_SIZE * 0)   // WOOD
];

World.isIn = function(x, y, z) {
  return x >= 0 && y >= 0 && z >= 0
      && x < World.X_SIZE && y < World.Y_SIZE && z < World.Z_SIZE;
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
  var height = World.Y_SIZE / 2;
  for (var i = 0; i < World.X_SIZE; ++i) {
    for (var j = 0; j < World.Z_SIZE; ++j) {
      height += Math.floor(Math.random() * 2) * 2 - 1;
      height = Math.max(0, Math.min(height, World.Y_SIZE - 1));
      var cellType = (Math.random() < 0.5) ?
          World.CellType.DIRT :
          World.CellType.ROCK;
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
    if (!cellType) {
      continue;
    }
    
    var x = i % World.X_SIZE;
    var y = Math.floor(i / World.Y_OFFSET) % World.Y_SIZE;
    var z = Math.floor(i / World.Z_OFFSET) % World.Z_SIZE;
    
    var tx = World.CELL_TX_OFFSET[cellType];
    var ty = World.CELL_TY_OFFSET[cellType];
    
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
    geo.faces.push(
      new THREE.Face3(vi+0, vi+2, vi+1),
      new THREE.Face3(vi+0, vi+3, vi+2),

      new THREE.Face3(vi+1, vi+6, vi+5),
      new THREE.Face3(vi+1, vi+2, vi+6),

      new THREE.Face3(vi+5, vi+7, vi+4),
      new THREE.Face3(vi+5, vi+6, vi+7),

      new THREE.Face3(vi+4, vi+3, vi+0),
      new THREE.Face3(vi+4, vi+7, vi+3),

      new THREE.Face3(vi+3, vi+6, vi+2),
      new THREE.Face3(vi+3, vi+7, vi+6),

      new THREE.Face3(vi+1, vi+4, vi+0),
      new THREE.Face3(vi+1, vi+5, vi+4)
    );
    for (j = 0; j < 6; ++j) {
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
    vi += 8;
  }
  geo.mergeVertices();
  geo.computeFaceNormals();
  var material = Materials.getMaterial(Materials.CELLS);
  var mesh = new THREE.Mesh(geo, material);
  this.root_.add(mesh);
};


/**
 * @private
 */
World.prototype.moveCamera_ = function() {
  //  this.camera.position = new THREE.Vector3(0.5, 0.5);
};


World.prototype.setCell = function(x, y, z, cell) {
  if (!World.isIn(x, y, z)) {
    // TODO(hru): log error
    return;
  }
  this.cells_[x + y * World.Y_OFFSET + z * World.Z_OFFSET] = cell;
/*
  var mesh = cell.getMesh();
  mesh.position.x = x + 0.5;
  mesh.position.y = y + 0.5;
  mesh.position.z = z + 0.5;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  this.root_.add(mesh);
*/
};

World.prototype.update = function(dt) {

};