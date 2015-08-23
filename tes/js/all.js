var tesp;
(function (tesp) {
    var Vec2 = (function () {
        function Vec2(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec2.prototype.distance = function (other) {
            return Math.sqrt(((other.x - this.x) * (other.x - this.x)) + ((other.y - this.y) * (other.y - this.y)));
        };
        Vec2.fromCell = function (x, y) {
            return new Vec2(x * Cell.width + Cell.widthOffset, y * Cell.height + Cell.heightOffset);
        };
        return Vec2;
    })();
    tesp.Vec2 = Vec2;
    var Cell = (function () {
        function Cell() {
        }
        Cell.fromPosition = function (pos) {
            return new Vec2((pos.x - Cell.widthOffset) / Cell.width, (pos.y - Cell.heightOffset) / Cell.height);
        };
        Cell.width = 44.5;
        Cell.height = 44.6;
        Cell.widthOffset = 20;
        Cell.heightOffset = 35;
        return Cell;
    })();
    tesp.Cell = Cell;
    var Node = (function () {
        function Node(name, longName, x, y, type) {
            this.name = name;
            this.longName = longName;
            this.type = type;
            this.id = Node.identity++;
            this.pos = new Vec2(x, y);
            this.edges = [];
        }
        Node.identity = 1;
        return Node;
    })();
    tesp.Node = Node;
    var Edge = (function () {
        function Edge(srcNode, destNode, cost) {
            this.srcNode = srcNode;
            this.destNode = destNode;
            this.cost = cost;
        }
        return Edge;
    })();
    tesp.Edge = Edge;
    var CellRow = (function () {
        function CellRow(y, x1, x2) {
            this.y = y;
            this.x1 = x1;
            this.x2 = x2;
            this.width = x2 - x1 + 1;
        }
        return CellRow;
    })();
    tesp.CellRow = CellRow;
    var Area = (function () {
        function Area(target, rows) {
            this.target = target;
            this.rows = rows;
            this.minY = rows[0].y;
            this.maxY = rows[rows.length - 1].y;
        }
        Area.prototype.containsCell = function (pos) {
            if (pos.y >= this.minY && pos.y < this.maxY + 1) {
                var row = this.rows[Math.floor(pos.y) - this.minY];
                return pos.x >= row.x1 && pos.x < row.x2 + 1;
            }
            return false;
        };
        return Area;
    })();
    tesp.Area = Area;
    (function (WorldUpdate) {
        WorldUpdate[WorldUpdate["ContextChange"] = 0] = "ContextChange";
        WorldUpdate[WorldUpdate["SourceChange"] = 1] = "SourceChange";
        WorldUpdate[WorldUpdate["DestinationChange"] = 2] = "DestinationChange";
        WorldUpdate[WorldUpdate["MarkChange"] = 3] = "MarkChange";
        WorldUpdate[WorldUpdate["FeatureChange"] = 4] = "FeatureChange";
        WorldUpdate[WorldUpdate["PathUpdate"] = 5] = "PathUpdate";
    })(tesp.WorldUpdate || (tesp.WorldUpdate = {}));
    var WorldUpdate = tesp.WorldUpdate;
    var Feature = (function () {
        function Feature(name, type, icon, affectsPath) {
            this.name = name;
            this.type = type;
            this.icon = icon;
            this.affectsPath = affectsPath;
        }
        return Feature;
    })();
    tesp.Feature = Feature;
    var PathEdge = (function () {
        function PathEdge(target, cost, type) {
            this.target = target;
            this.cost = cost;
            this.type = type;
        }
        return PathEdge;
    })();
    tesp.PathEdge = PathEdge;
    var PathNode = (function () {
        function PathNode(node) {
            this.node = node;
            this.dist = Infinity;
        }
        return PathNode;
    })();
    tesp.PathNode = PathNode;
    var World = (function () {
        function World(data) {
            var _this = this;
            this.listeners = [];
            this.nodesById = {};
            this.features = [
                new Feature("Recall", "mark", "bolt", true),
                new Feature("Mages Guild", "mages-guild", "eye", true),
                new Feature("Silt Strider", "silt-strider", "bug", true),
                new Feature("Boat", "boat", "ship", true),
                new Feature("Holamayan Boat", "holamayan", "ship", true),
                new Feature("Propylon Chamber", "propylon", "cog", true),
                new Feature("Vivec Gondola", "gondola", "ship", true),
                new Feature("Divine Intervention", "divine", "bolt", true),
                new Feature("Almsivi Intervention", "almsivi", "bolt", true),
                new Feature("Transport lines", "edge", "", false),
                new Feature("Locations", "node", "", false),
                new Feature("Intervention area borders", "area", "", false),
                new Feature("Gridlines", "grid", "", false)
            ];
            var fIdx = this.features.byName = {};
            this.features.forEach(function (f) { return fIdx[f.type] = f; });
            fIdx['edge'].hidden = fIdx['area'].hidden = fIdx['grid'].hidden = true;
            this.nodes = [];
            this.edges = [];
            this.areas = [];
            for (var k in data.transport) {
                this.loadTransport(data.transport, k);
            }
            this.regions = data.regions
                .map(function (a) { return _this.makeArea(new Node(a.name, a.name, 0, 0, "region"), a); });
            this.landmarks = data.landmarks.map(function (a) {
                var node = new Node(a.name, a.name, 0, 0, "landmark");
                var area = _this.makeArea(node, a);
                // set node location to average center point of all cells
                var sumX = 0;
                var sumY = 0;
                var count = 0;
                area.rows.forEach(function (r) {
                    sumX += (r.x1 + r.width / 2) * r.width;
                    sumY += (r.y + 0.5) * r.width;
                    count += r.width;
                });
                node.pos = Vec2.fromCell(sumX / count, sumY / count);
                return area;
            });
            // index by id
            this.nodesById = {};
            this.nodes.forEach(function (n) { return _this.nodesById[n.id] = n; });
            this.addListener(function (reason) {
                if (reason === WorldUpdate.SourceChange
                    || reason === WorldUpdate.DestinationChange
                    || reason === WorldUpdate.MarkChange
                    || reason === WorldUpdate.FeatureChange)
                    _this.findPath();
            });
        }
        World.prototype.loadTransport = function (data, type) {
            var _this = this;
            var array = data[type];
            var typeName = this.features.byName[type].name;
            var nodes = array.map(function (n) { return new Node(n.name, n.name + " (" + typeName + ")", n.x, n.y, type); });
            this.nodes = this.nodes.concat(nodes);
            var cost = World.transportCost[type] || World.defaultTransportCost;
            array.forEach(function (n, i1) {
                var n1 = nodes[i1];
                if (n.edges) {
                    n.edges.forEach(function (i2) {
                        var n2 = nodes[i2];
                        var edge = new Edge(n1, n2, cost);
                        n1.edges.push(edge);
                        n2.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.oneWayEdges) {
                    n.oneWayEdges.forEach(function (i2) {
                        var edge = new Edge(n1, nodes[i2], cost);
                        n1.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.cells) {
                    _this.areas.push(_this.makeArea(n1, n));
                }
            });
        };
        World.prototype.makeArea = function (node, data) {
            var y = data.top || 0;
            var rows = data.cells.map(function (c) { return new CellRow(y++, c[0], c[1]); });
            return new Area(node, rows);
        };
        World.prototype.addListener = function (listener) {
            this.listeners.push(listener);
        };
        World.prototype.trigger = function (reason) {
            this.listeners.forEach(function (fn) { return fn(reason); });
        };
        World.prototype.findNodeById = function (id) {
            return this.nodesById[id] || null;
        };
        World.prototype.findPath = function () {
            var _this = this;
            if (this.sourceNode == null || this.destNode == null || this.sourceNode === this.destNode) {
                this.pathEnd = null;
                this.trigger(WorldUpdate.PathUpdate);
                return;
            }
            // create nodes
            var nodeMap = {};
            var feats = this.features.byName;
            var nodes = this.nodes
                .filter(function (n) { return !feats[n.type].disabled && n !== _this.sourceNode && n !== _this.destNode; })
                .map(function (n) { return nodeMap[n.id] = new PathNode(n); });
            var source = new PathNode(this.sourceNode);
            source.dist = 0;
            nodes.push(source);
            nodeMap[this.sourceNode.id] = source;
            var dest = new PathNode(this.destNode);
            nodes.push(dest);
            nodeMap[this.destNode.id] = dest;
            var maxCost = this.sourceNode.pos.distance(this.destNode.pos);
            // explicit edges (services)
            nodes.forEach(function (n) {
                return n.edges = n.node.edges.map(function (e) {
                    return new PathEdge(nodeMap[(e.srcNode === n.node ? e.destNode : e.srcNode).id], e.cost, n.node.type);
                });
            });
            // implicit edges (walking)
            nodes.forEach(function (n) {
                return n.edges = n.edges.concat(nodes
                    .filter(function (n2) { return n2 !== n && !n.edges.some(function (e) { return e.target === n2; }); })
                    .map(function (n2) { return new PathEdge(n2, n.node.pos.distance(n2.node.pos), "walk"); })
                    .filter(function (e) { return e.cost <= maxCost; }));
            });
            // mark
            if (this.markNode != null && !feats['mark'].disabled) {
                var mn = new PathNode(this.markNode);
                mn.edges = nodes.filter(function (n) { return n !== source; })
                    .map(function (n) { return new PathEdge(n, mn.node.pos.distance(n.node.pos), "walk"); })
                    .filter(function (e) { return e.cost < maxCost; });
                source.edges.push(new PathEdge(mn, World.spellCost, "mark"));
                nodes.push(mn);
            }
            // intervention
            nodes.forEach(function (n) {
                var cell = Cell.fromPosition(n.node.pos);
                _this.areas.forEach(function (a) {
                    if (!feats[a.target.type].disabled) {
                        if (a.containsCell(cell)) {
                            // node inside area, teleport to temple/shrine
                            n.edges.push(new PathEdge(nodeMap[a.target.id], World.spellCost, a.target.type));
                        }
                        else {
                            // node outside area, walk to edge
                            var dist = Infinity;
                            var closest;
                            a.rows.forEach(function (r) {
                                // v is closest point (in cell units) from node to row
                                var v = new Vec2(Math.max(Math.min(cell.x, r.x1 + r.width), r.x1), Math.max(Math.min(cell.y, r.y + 1), r.y));
                                var alt = cell.distance(v);
                                if (alt < dist) {
                                    dist = alt;
                                    closest = v;
                                }
                            });
                            var pos = Vec2.fromCell(closest.x, closest.y);
                            var cost = n.node.pos.distance(pos);
                            if (cost < maxCost) {
                                // new node to allow us to teleport once we're in the area
                                var name = a.target.name + " " + a.target.type + " area";
                                var an = new PathNode(new Node(name, name, pos.x, pos.y, "area"));
                                an.edges = [new PathEdge(nodeMap[a.target.id], World.spellCost, a.target.type)];
                                nodes.push(an);
                                n.edges.push(new PathEdge(an, cost, "walk"));
                            }
                        }
                    }
                });
            });
            var q = nodes.slice();
            while (q.length > 0) {
                q.sort(function (a, b) { return b.dist - a.dist; });
                var u = q.pop();
                for (var i = 0; i < u.edges.length; i++) {
                    var e = u.edges[i];
                    var v = e.target;
                    var alt = u.dist + e.cost;
                    if (alt < v.dist) {
                        v.dist = alt;
                        v.prev = u;
                        v.prevEdge = e;
                    }
                }
            }
            this.pathEnd = dest;
            this.trigger(WorldUpdate.PathUpdate);
        };
        Object.defineProperty(World.prototype, "context", {
            get: function () {
                return this._context;
            },
            set: function (value) {
                this._context = value;
                this.trigger(WorldUpdate.ContextChange);
            },
            enumerable: true,
            configurable: true
        });
        World.prototype.contextClick = function (x, y) {
            if (!this.context)
                return;
            if (this.context === 'source') {
                var name = this.getAreaName(x, y) || "You";
                this.contextNode(new Node(name, name, x, y, "source"));
            }
            else if (this.context === 'destination') {
                var name = this.getAreaName(x, y) || "Your destination";
                this.contextNode(new Node(name, name, x, y, "destination"));
            }
            else if (this.context === 'mark') {
                var region = this.getAreaName(x, y);
                this.markNode = new Node("Mark", region ? "Mark in " + region : "Mark", x, y, "mark");
                this.trigger(WorldUpdate.MarkChange);
                this.context = null;
            }
        };
        World.prototype.getAreaName = function (x, y) {
            var area;
            var cell = Cell.fromPosition(new Vec2(x, y));
            return this.landmarks.some(function (r) { return r.containsCell(cell) && (area = r) != null; })
                || this.regions.some(function (r) { return r.containsCell(cell) && (area = r) != null; })
                ? area.target.name
                : null;
        };
        World.prototype.contextNode = function (node) {
            if (!this.context)
                return;
            if (this.context === 'source') {
                this.sourceNode = node;
                this.context = null;
                this.trigger(WorldUpdate.SourceChange);
            }
            else if (this.context === 'destination') {
                this.destNode = node;
                this.context = null;
                this.trigger(WorldUpdate.DestinationChange);
            }
            else if (this.context === 'mark') {
                var pos = node.pos;
                this.markNode = new Node(node.name, node.longName, pos.x, pos.y, "mark");
                this.markNode.referenceId = node.referenceId || node.id;
                this.context = null;
                this.trigger(WorldUpdate.MarkChange);
            }
        };
        World.prototype.clearContext = function (context) {
            if (context === 'source') {
                this.sourceNode = null;
                this.context = null;
                this.trigger(WorldUpdate.SourceChange);
            }
            else if (context === 'destination') {
                this.destNode = null;
                this.context = null;
                this.trigger(WorldUpdate.DestinationChange);
            }
            else if (context === 'mark') {
                this.markNode = null;
                this.context = null;
                this.trigger(WorldUpdate.MarkChange);
            }
        };
        World.defaultTransportCost = 10;
        World.transportCost = { "mages-guild": 30 };
        World.spellCost = 5;
        return World;
    })();
    tesp.World = World;
})(tesp || (tesp = {}));
/// <reference path="world.ts" />
var tesp;
(function (tesp) {
    var Controls = (function () {
        function Controls(world, element) {
            var _this = this;
            this.world = world;
            this.element = element;
            world.addListener(function (reason) {
                if (reason === tesp.WorldUpdate.PathUpdate)
                    _this.updatePath();
                else if (reason === tesp.WorldUpdate.SourceChange)
                    _this.updateNodeInfo('.control-source-info', _this.world.sourceNode);
                else if (reason === tesp.WorldUpdate.DestinationChange)
                    _this.updateNodeInfo('.control-destination-info', _this.world.destNode);
                else if (reason === tesp.WorldUpdate.MarkChange)
                    _this.updateNodeInfo('.control-mark-info', _this.world.markNode);
            });
            var nodeSearchIndex = {};
            var searchInput = element.querySelector('.search-input');
            var datalist = element.querySelector('#search-list');
            this.world.nodes
                .concat(this.world.landmarks.map(function (a) { return a.target; }))
                .forEach(function (n) {
                var opt = document.createElement("option");
                var feat = _this.world.features.byName[n.type];
                var value = feat ? n.name + " (" + _this.world.features.byName[n.type].name + ")" : n.name;
                nodeSearchIndex[value] = n;
                opt.value = value;
                datalist.appendChild(opt);
            });
            for (var child = element.firstElementChild; child; child = child.nextElementSibling) {
                var name = child.dataset['controlContainer'];
                if (name === "path") {
                    this.pathContainer = child;
                }
                else if (name === "features") {
                    this.featuresContainer = child;
                }
            }
            this.drawFeatures();
            element.onclick = function (ev) {
                if (ev.target instanceof HTMLButtonElement) {
                    var data = ev.target.dataset;
                    var cset = data['contextSet'];
                    if (cset !== undefined) {
                        _this.world.context = cset;
                    }
                    var cunset = data['contextUnset'];
                    if (cunset !== undefined) {
                        _this.world.clearContext(cunset);
                    }
                    var csearch = data['contextSearch'];
                    if (csearch !== undefined) {
                        var node = nodeSearchIndex[searchInput.value];
                        if (node !== undefined) {
                            _this.world.context = csearch;
                            _this.world.contextNode(node);
                            searchInput.value = "";
                        }
                    }
                }
            };
        }
        Controls.prototype.updateNodeInfo = function (selector, node) {
            this.element.querySelector(selector).textContent = node != null ? node.longName : "";
        };
        Controls.prototype.updatePath = function () {
            var child;
            while (child = this.pathContainer.firstElementChild) {
                this.pathContainer.removeChild(child);
            }
            var pathNode = this.world.pathEnd;
            while (pathNode) {
                this.pathContainer.insertBefore(this.drawPathNode(pathNode), this.pathContainer.firstElementChild);
                pathNode = pathNode.prev;
            }
        };
        Controls.prototype.drawPathNode = function (node) {
            var el = document.createElement("div");
            var icon, text;
            var edge = node.prevEdge;
            if (edge) {
                var action;
                if (edge.type === "walk") {
                    action = "Walk";
                    icon = "compass";
                }
                else {
                    var feat = this.world.features.byName[edge.type];
                    if (feat) {
                        action = feat.name;
                        icon = feat.icon;
                    }
                    else {
                        action = edge.type;
                        icon = "question";
                    }
                }
                var loc = node.node.type == edge.type ? node.node.name : node.node.longName;
                text = action + " to " + loc;
            }
            else {
                icon = "map-marker";
                text = node.node.longName;
            }
            var i = document.createElement("i");
            i.classList.add("path-icon");
            i.classList.add("fa");
            i.classList.add("fa-" + icon);
            el.appendChild(i);
            el.appendChild(document.createTextNode(" " + text));
            return el;
        };
        Controls.prototype.drawFeatures = function () {
            var _this = this;
            this.world.features.forEach(function (f) {
                var el = document.createElement("div");
                el.textContent = f.name + ":";
                el.appendChild(_this.drawCheckbox(function (val) {
                    f.hidden = !val;
                    _this.world.trigger(tesp.WorldUpdate.FeatureChange);
                }, !f.hidden));
                if (f.affectsPath)
                    el.appendChild(_this.drawCheckbox(function (val) {
                        f.disabled = !val;
                        _this.world.trigger(tesp.WorldUpdate.FeatureChange);
                    }, !f.disabled));
                _this.featuresContainer.appendChild(el);
            });
        };
        Controls.prototype.drawCheckbox = function (onchange, initial) {
            var input = document.createElement("input");
            input.type = "checkbox";
            input.onchange = function (ev) { return onchange(input.checked); };
            input.checked = initial;
            return input;
        };
        return Controls;
    })();
    tesp.Controls = Controls;
})(tesp || (tesp = {}));
/// <reference path="world.ts" />
var tesp;
(function (tesp) {
    var Map = (function () {
        function Map(world, element) {
            var _this = this;
            this.world = world;
            this.element = element;
            world.addListener(function (reason) {
                if (reason === tesp.WorldUpdate.PathUpdate)
                    _this.renderPath();
                else if (reason === tesp.WorldUpdate.SourceChange)
                    _this.renderSource();
                else if (reason === tesp.WorldUpdate.DestinationChange)
                    _this.renderDestination();
                else if (reason === tesp.WorldUpdate.MarkChange)
                    _this.renderMark();
                else if (reason === tesp.WorldUpdate.FeatureChange)
                    _this.updateFeatures();
            });
            element.onclick = function (ev) {
                if (!_this.world.context)
                    return;
                var target = ev.target;
                var node = null;
                if (target.classList.contains('map-node')) {
                    var id = target.dataset['nodeId'];
                    if (id !== undefined) {
                        node = _this.world.findNodeById(+id);
                    }
                }
                if (node != null)
                    _this.world.contextNode(node);
                else
                    _this.world.contextClick(ev.pageX, ev.pageY);
            };
            this.renderNodes();
            this.renderPath();
            this.renderMark();
            this.renderGrid();
            this.updateFeatures();
        }
        Map.prototype.renderNodes = function () {
            var _this = this;
            if (this.nodeContainer != null)
                this.nodeContainer.parentElement.removeChild(this.nodeContainer);
            this.nodeContainer = document.createElement("div");
            this.element.appendChild(this.nodeContainer);
            this.world.nodes
                .forEach(function (n) { return _this.nodeContainer.appendChild(_this.drawNode(n)); });
            if (this.edgeContainer != null)
                this.edgeContainer.parentElement.removeChild(this.edgeContainer);
            this.edgeContainer = document.createElement("div");
            this.element.appendChild(this.edgeContainer);
            this.world.edges.forEach(function (e) {
                return _this.edgeContainer.appendChild(_this.drawEdge(e.srcNode.pos, e.destNode.pos, e.srcNode.type, "map-transport-edge"));
            });
            if (this.areaContainer != null)
                this.areaContainer.parentElement.removeChild(this.areaContainer);
            this.areaContainer = document.createElement("div");
            this.element.appendChild(this.areaContainer);
            this.world.areas
                .forEach(function (a) {
                var type = a.target.type;
                var prev = null;
                for (var i = 0; i < a.rows.length; i++) {
                    var row = a.rows[i];
                    if (prev != null) {
                        if (row.x1 !== prev.x1) {
                            _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, prev.x1, row.y, type));
                        }
                        if (row.x2 !== prev.x2) {
                            _this.areaContainer.appendChild(_this.drawCellEdge(row.x2 + 1, row.y, prev.x2 + 1, row.y, type));
                        }
                    }
                    else {
                        _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, row.x2 + 1, row.y, type));
                    }
                    _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, row.x1, row.y + 1, type));
                    _this.areaContainer.appendChild(_this.drawCellEdge(row.x2 + 1, row.y, row.x2 + 1, row.y + 1, type));
                    prev = row;
                }
                _this.areaContainer.appendChild(_this.drawCellEdge(prev.x1, prev.y + 1, prev.x2 + 1, prev.y + 1, type));
            });
        };
        Map.prototype.drawCellEdge = function (x1, y1, x2, y2, type) {
            return this.drawEdge(tesp.Vec2.fromCell(x1, y1), tesp.Vec2.fromCell(x2, y2), type, "map-area");
        };
        Map.prototype.renderPath = function () {
            if (this.pathContainer != null)
                this.pathContainer.parentElement.removeChild(this.pathContainer);
            var pathNode = this.world.pathEnd;
            if (pathNode == null) {
                this.pathContainer = null;
                return;
            }
            this.pathContainer = document.createElement("div");
            this.element.appendChild(this.pathContainer);
            while (pathNode && pathNode.prev) {
                this.pathContainer.appendChild(this.drawEdge(pathNode.node.pos, pathNode.prev.node.pos, 'path', 'map-' + pathNode.prevEdge.type));
                pathNode = pathNode.prev;
            }
        };
        Map.prototype.renderMark = function () {
            this.markElem = this.addOrUpdateNodeElem(this.world.markNode, this.markElem);
        };
        Map.prototype.renderSource = function () {
            this.sourceElem = this.addOrUpdateNodeElem(this.world.sourceNode, this.sourceElem);
        };
        Map.prototype.renderDestination = function () {
            this.destElem = this.addOrUpdateNodeElem(this.world.destNode, this.destElem);
        };
        Map.prototype.addOrUpdateNodeElem = function (node, elem) {
            if (elem)
                elem.parentElement.removeChild(elem);
            return node != null
                ? this.element.appendChild(this.drawNode(node))
                : null;
        };
        Map.prototype.renderGrid = function () {
            if (!this.gridContainer) {
                this.gridContainer = document.createElement("div");
                this.element.appendChild(this.gridContainer);
                for (var i = 0; i < 37; i++) {
                    var el = document.createElement('div');
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-v");
                    el.style.left = (i * tesp.Cell.width + tesp.Cell.widthOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
                for (var i = 0; i < 42; i++) {
                    var el = document.createElement('div');
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-h");
                    el.style.top = (i * tesp.Cell.height + tesp.Cell.heightOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
            }
        };
        Map.prototype.updateFeatures = function () {
            var _this = this;
            this.element.className = "";
            this.world.features.forEach(function (f) {
                if (f.hidden)
                    _this.element.classList.add("hide-" + f.type);
            });
        };
        Map.prototype.drawNode = function (node) {
            var element = document.createElement("div");
            element.classList.add("map-node");
            element.classList.add("map-" + node.type);
            element.title = node.longName;
            element.style.left = node.pos.x + "px";
            element.style.top = node.pos.y + "px";
            element.dataset['nodeId'] = (node.referenceId || node.id) + '';
            return element;
        };
        Map.prototype.drawEdge = function (n1, n2, type, subtype) {
            var element = document.createElement("div");
            element.classList.add("map-edge");
            element.classList.add("map-" + type);
            if (subtype)
                element.classList.add(subtype);
            var length = n1.distance(n2);
            element.style.left = ((n1.x + n2.x) / 2) - (length / 2) + "px";
            element.style.top = ((n1.y + n2.y) / 2) - 1 + "px";
            element.style.width = length + "px";
            element.style.transform = "rotate(" + Math.atan2(n1.y - n2.y, n1.x - n2.x) + "rad)";
            return element;
        };
        return Map;
    })();
    tesp.Map = Map;
})(tesp || (tesp = {}));
/// <reference path="d/whatwg-fetch/whatwg-fetch.d.ts" />
/// <reference path="world.ts" />
/// <reference path="controls.ts" />
/// <reference path="map.ts" />
var tesp;
(function (tesp) {
    window.fetch("data/data.json").then(function (res) {
        return res.json().then(function (data) {
            var world = new tesp.World(data);
            new tesp.Map(world, document.getElementById("map"));
            new tesp.Controls(world, document.getElementById("controls"));
            document.body.classList.remove("loading");
        });
    });
})(tesp || (tesp = {}));
//# sourceMappingURL=all.js.map