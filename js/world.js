World = function(camera) {
  this.cells_ = new Uint8Array(World.TOTAL_SIZE);
  this.geoFaces_ = new Int32Array(World.TOTAL_SIZE * 6);
  this.facePool_ = [];

  this.root_ = new THREE.Object3D();
  this.root_.position.x = -World.X_SIZE / 2;
  this.root_.position.z = -World.Z_SIZE / 2;
  
  this.camera_ = camera;
};

World.X_SIZE = 30;
World.Y_SIZE = 30;
World.Z_SIZE = 30;

World.VERTEX_OFFSET_X = 1;
World.VERTEX_OFFSET_Y = World.X_SIZE + 1;
World.VERTEX_OFFSET_Z = (World.X_SIZE + 1) * (World.Y_SIZE + 1);

World.TOTAL_SIZE = World.X_SIZE * World.Y_SIZE * World.Z_SIZE;

World.Y_OFFSET = World.X_SIZE;
World.Z_OFFSET = World.X_SIZE * World.Y_SIZE;

World.CELL_TX_SIZE = 1 / 4;
World.CELL_TY_SIZE = 1 / 2;

World.MAX_FACE_COUNT = World.X_SIZE * World.Z_SIZE * 6 * 4;

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
  [5, 7, 4, 6],
  [3, 6, 2, 7],
  [1, 6, 5, 2],
  [0, 2, 1, 3],
  [1, 4, 0, 5],
  [4, 3, 0, 7]
];

World.FACE_NODES = [
  0,
  World.VERTEX_OFFSET_X,
  World.VERTEX_OFFSET_X+World.VERTEX_OFFSET_Y,
  World.VERTEX_OFFSET_Y,
  World.VERTEX_OFFSET_Z,
  World.VERTEX_OFFSET_X+World.VERTEX_OFFSET_Z,
  World.VERTEX_OFFSET_X+World.VERTEX_OFFSET_Y+World.VERTEX_OFFSET_Z,
  World.VERTEX_OFFSET_Y+World.VERTEX_OFFSET_Z
];

World.NEXT_OFFSET = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, -1],
  [0, -1, 0],
  [-1, 0, 0]
];

World.MAX_WATER_ITER = World.Y_SIZE * 3;

World.WATER_MOVES = [
  [0, 0, -1],
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0]
];

World.id_ = function(x, y, z) {
  return x + y * World.Y_OFFSET + z * World.Z_OFFSET;
};

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
  var w = this;

  var drop = function(x, z, cellType, radius) {
    for (var i = -radius; i <= radius; ++i) {
      for (var j = -radius; j <= radius; ++j) {
        if (!World.isIn(x + i, 0, z + j)) {
          continue;
        }
        var h = Math.round(Math.sqrt(radius * radius - i * i - j * j));
        var k;
        for (k = World.Y_SIZE; k > 0; --k) {
          if (w.getCell(x + i, k - 1, z + j) != World.CellType.EMPTY) {
            break;
          }
        }
        for (; h > 0 && k < World.Y_SIZE; --h,++k) {
          w.setCell(x + i, k, z + j, cellType);
        }
      }
    }
  };

  for (var i = 0; i < World.X_SIZE; ++i) {
    for (var j = 0; j < World.Z_SIZE; ++j) {
      this.setCell(i, 0, j, World.CellType.DIRT);
    }
  }
  var cts = [World.CellType.DIRT, World.CellType.WOOD, World.CellType.ROCK];
  var sts = [2, 4, 6];
  var rs = [3, 4, 5]
  for (var ct = 0; ct < cts.length; ++ct) {
    var cellType = cts[ct];
    var st = sts[ct];
    for (var i = 0; i < World.X_SIZE; i += st) {
      for (var j = 0; j < World.Z_SIZE; j += st) {
        var x = i + Math.floor(Math.random() * (st * 2 + 1)) - st;
        var z = j + Math.floor(Math.random() * (st * 2 + 1)) - st;
        var r = Math.floor(Math.random() * rs[ct]);
        drop(x, z, cellType, r);
      }
    }
  }

  // Spawn water
  var wcs = [];
  for (var i = 0; i < World.X_SIZE; ++i) {
    for (var j = 0; j < World.Z_SIZE; ++j) {
      if (this.getCell(i, World.Y_SIZE - 1, j) == World.CellType.EMPTY) {
        wcs.push([i, World.Y_SIZE - 1, j, 0]);
        this.setCell(i, World.Y_SIZE - 1, j, World.CellType.WATER);
      }
    }
  }
  var n = wcs.length;
  for (var iter = 0; iter < World.MAX_WATER_ITER; ++iter) {
    for (var i = 0; i < n; ++i) {
      if (World.isIn(wcs[i][0], wcs[i][1] - 1, wcs[i][2]) &&
          this.getCell(wcs[i][0], wcs[i][1] - 1, wcs[i][2]) == World.CellType.EMPTY) {
        this.setCell(wcs[i][0], wcs[i][1] - 1, wcs[i][2], World.CellType.WATER);
        this.setCell(wcs[i][0], wcs[i][1], wcs[i][2], World.CellType.EMPTY);
        --wcs[i][1];
      } else {
        for (var j = 0; j < 4; ++j) {
          var nx = wcs[i][0] + World.WATER_MOVES[wcs[i][3]][0];
          var ny = wcs[i][1] + World.WATER_MOVES[wcs[i][3]][1];
          var nz = wcs[i][2] + World.WATER_MOVES[wcs[i][3]][2];
          if (World.isIn(nx, ny, nz) &&
              this.getCell(nx, ny, nz) == World.CellType.EMPTY) {
            this.setCell(nx, ny, nz, World.CellType.WATER);
            this.setCell(wcs[i][0], wcs[i][1], wcs[i][2], World.CellType.EMPTY);
            wcs[i][0] = nx;
            wcs[i][1] = ny;
            wcs[i][2] = nz;
            break;
          }
          wcs[i][3] = (wcs[i][3] + 1) & 3;
        }
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
  for (var i = 0; i < World.TOTAL_SIZE * 6; ++i) {
    this.geoFaces_[i] = -1;
  }
  // Generating vertices
  for (var k = 0; k <= World.Z_SIZE; ++k) {
    for (var j = 0; j <= World.Y_SIZE; ++j) {
      for (var i = 0; i <= World.X_SIZE; ++i) {
        geo.vertices.push(new THREE.Vector3(i, j, k));
      }
    }
  }
  // Generating faces
  for (var i = 0; i < World.MAX_FACE_COUNT; ++i) {
    this.facePool_.push(geo.faces.length);
    for (var j = 0; j < 2; ++j) {
      geo.faces.push(new THREE.Face3(0, 0, 0));
      geo.faceVertexUvs[0].push([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0)
      ]);
    }
  }

  for (var i = 0; i < World.TOTAL_SIZE; ++i) {
    var cellType = this.cells_[i];
    if (!cellType || cellType == World.CellType.EMPTY) {
      continue;
    }

    for (var j = 0; j < 6; ++j) {
      var nextCell = this.getNextCell_(i, j);
      if (nextCell != cellType && World.isTransparent_(nextCell)) {
        this.addFace_(geo, i, j, cellType);
      }
    }
  }
  // geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  var materials = [
    Materials.getMaterial(Materials.SOLID_CELLS),
    Materials.getMaterial(Materials.TRANSPARENT_CELLS)
  ];
  this.mainMesh_ = new THREE.Mesh(geo, new THREE.MeshFaceMaterial(materials));
  this.root_.add(this.mainMesh_);
};

World.prototype.addFace_ = function(geo, id, j, cellType) {
  if (this.geoFaces_[id * 6 + j] >= 0) {
    debugger;
  }
  var faceId = this.facePool_.pop();
  this.geoFaces_[id * 6 + j] = faceId;
  this.updateFace_(geo, id, j, faceId, cellType);
};

World.prototype.updateFace_ = function(geo, id, j, faceId, cellType) {
  var eps = World.CELL_TX_SIZE * 0.05;
  var tx = World.CELL_TX_OFFSET[cellType] + eps;
  var ty = World.CELL_TY_OFFSET[cellType] + eps;
  var materialIndex = World.isTransparent_(cellType) ? 1 : 0;

  var f = World.FACES[j];
  var norm = World.NEXT_OFFSET[j];

  var vi = World.idToVertexRoot_(id);
  var face = geo.faces[faceId];
  face.a = vi+World.FACE_NODES[f[0]];
  face.b = vi+World.FACE_NODES[f[1]];
  face.c = vi+World.FACE_NODES[f[2]];
  face.normal.set(norm[0], norm[1], norm[2]);
  face.materialIndex = materialIndex;

  face = geo.faces[faceId + 1];
  face.a = vi+World.FACE_NODES[f[0]];
  face.b = vi+World.FACE_NODES[f[3]];
  face.c = vi+World.FACE_NODES[f[1]];
  face.normal.set(norm[0], norm[1], norm[2]);
  face.materialIndex = materialIndex;

  geo.faceVertexUvs[0][faceId][0].set(tx, ty);
  geo.faceVertexUvs[0][faceId][1].set(tx + World.CELL_TX_SIZE - 2 * eps, ty + World.CELL_TY_SIZE - 2 * eps);
  geo.faceVertexUvs[0][faceId][2].set(tx + World.CELL_TX_SIZE - 2 * eps, ty);
  geo.faceVertexUvs[0][faceId+1][0].set(tx, ty);
  geo.faceVertexUvs[0][faceId+1][1].set(tx, ty + World.CELL_TY_SIZE - 2 * eps);
  geo.faceVertexUvs[0][faceId+1][2].set(tx + World.CELL_TX_SIZE - 2 * eps, ty + World.CELL_TY_SIZE - 2 * eps);
};

World.prototype.safeRemoveFace_ = function(geo, id, j) {
  var faceId = this.geoFaces_[id * 6 + j];
  if (faceId >= 0) {
    geo.faces[faceId].a = 0;
    geo.faces[faceId].b = 0;
    geo.faces[faceId].c = 0;
    geo.faces[faceId + 1].a = 0;
    geo.faces[faceId + 1].b = 0;
    geo.faces[faceId + 1].c = 0;
    this.facePool_.push(faceId);
    this.geoFaces_[id * 6 + j] = -1;
    return true;
  }
  return false;
};

/**
 * @private
 */
World.prototype.moveCamera_ = function() {
  //  this.camera.position = new THREE.Vector3(0.5, 0.5);
};


World.prototype.updateCell = function(x, y, z, newCell) {
  if (!World.isIn(x, y, z)) {
    // TODO(hru): log error
    return;
  }
  var id = World.id_(x, y, z);
  var cellType = this.cells_[id];
  if (newCell == cellType) {
    return;
  }
  var geo = this.mainMesh_.geometry;
  var updated = false;
  for (var j = 0; j < 6; ++j) {
    var norm = World.NEXT_OFFSET[j];
    var nx = x + norm[0];
    var ny = y + norm[1];
    var nz = z + norm[2];
    var nextId = World.id_(nx, ny, nz);
    var nextCell = this.getCell(nx, ny, nz);
    // need to remove this face
    if (cellType != World.CellType.EMPTY && nextCell != cellType && World.isTransparent_(nextCell)) {
      if (this.safeRemoveFace_(geo, id, j)) {
        updated = true;
      }
    }
    if (newCell != World.CellType.EMPTY && nextCell != newCell && World.isTransparent_(nextCell)) {
      this.addFace_(geo, id, j, newCell);
      updated = true;
    }
    // near cell faces
    var nj = (j + 3) % 6;
    if (nextCell != World.CellType.EMPTY && nextCell != cellType && World.isTransparent_(cellType) &&
        (nextCell == newCell || !World.isTransparent_(newCell))) {
      if (this.safeRemoveFace_(geo, nextId, nj)) {
        updated = true;
      }
    }
    if (nextCell != World.CellType.EMPTY && nextCell != newCell && World.isTransparent_(newCell) &&
        !(nextCell != cellType && World.isTransparent_(cellType))) {
      this.addFace_(geo, nextId, nj, nextCell);
      updated = true;
    }
  }
  this.cells_[id] = newCell;
  if (updated) {
    geo.elementsNeedUpdate = true;
    geo.verticesNeedUpdate = true;
    geo.normalsNeedUpdate = true;
    geo.uvsNeedUpdate = true;
    // geo.computeVertexNormals();
//    freshGeo.computeBoundingBox();
//    freshGeo.computeBoundingSphere();
  }
};


World.idToVertexRoot_ = function(id) {
  var z = Math.floor(id / World.Z_OFFSET);
  id -= z * World.Z_OFFSET;
  var y = Math.floor(id / World.Y_OFFSET);
  id -= y * World.Y_OFFSET;
  var x = id;
  return x * World.VERTEX_OFFSET_X +
      y * World.VERTEX_OFFSET_Y +
      z * World.VERTEX_OFFSET_Z;
};


World.prototype.getCell = function(x, y, z) {
  if (!World.isIn(x, y, z)) {
    return World.CellType.EMPTY;
  }
  return this.cells_[World.id_(x, y, z)];
};

World.prototype.getNextCell_ = function(id, j) {
  var z = Math.floor(id / World.Z_OFFSET);
  id -= z * World.Z_OFFSET;
  var y = Math.floor(id / World.Y_OFFSET);
  id -= y * World.Y_OFFSET;
  var x = id;
  var norm = World.NEXT_OFFSET[j];
  return this.getCell(
    x + norm[0],
    y + norm[1],
    z + norm[2]
  );
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
  this.cells_[World.id_(x, y, z)] = cell;
};

World.prototype.update = function(dt) {
//  if (Math.random() > 0.5) {
//    return;
//  } 
//  for (var k = World.Y_SIZE - 1; k >= 0; --k) {
  for (var k = 0; k < World.Y_SIZE; ++k) {
    for (var i = 0; i < World.X_SIZE; ++i) {
      for (var j = 0; j < World.Z_SIZE; ++j) {
        if (this.getCell(i, k, j) == World.CellType.EMPTY) {
          this.updateCell(i, k, j, World.CellType.WATER);
          return;
        }
      }
    }
  }
/*
  var i = Math.floor(Math.random() * World.X_SIZE);
  var k = Math.floor(Math.random() * World.Y_SIZE);
  var j = Math.floor(Math.random() * World.Z_SIZE);
  this.updateCell(i, k, j, World.CellType.ROCK);
*/
};