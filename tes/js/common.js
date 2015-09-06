var Tesp;!function(Tesp){var Vec2=function(){function Vec2(x,y){void 0===x&&(x=0),void 0===y&&(y=0),this.x=x,this.y=y}return Vec2.distance=function(src,dst){return Math.sqrt((dst.x-src.x)*(dst.x-src.x)+(dst.y-src.y)*(dst.y-src.y))},Vec2.fromCell=function(x,y){return new Vec2(x*Cell.width+Cell.widthOffset,y*Cell.height+Cell.heightOffset)},Vec2}();Tesp.Vec2=Vec2;var Node=function(){function Node(name,longName,pos,type,permanent){void 0===permanent&&(permanent=!1),this.name=name,this.longName=longName,this.pos=pos,this.type=type,this.permanent=permanent,this.id=Node.identity++,this.edges=[]}return Node.identity=1,Node}();Tesp.Node=Node;var Edge=function(){function Edge(srcNode,destNode,cost){this.srcNode=srcNode,this.destNode=destNode,this.cost=cost}return Edge}();Tesp.Edge=Edge;var Cell=function(){function Cell(){}return Cell.fromPosition=function(pos){return new Vec2((pos.x-Cell.widthOffset)/Cell.width,(pos.y-Cell.heightOffset)/Cell.height)},Cell.width=44.5,Cell.height=44.6,Cell.widthOffset=12,Cell.heightOffset=35,Cell}();Tesp.Cell=Cell;var CellRow=function(){function CellRow(y,x1,x2){this.y=y,this.x1=x1,this.x2=x2,this.width=x2-x1+1}return CellRow}();Tesp.CellRow=CellRow;var Area=function(){function Area(target,rows){this.target=target,this.rows=rows,this.minY=rows[0].y,this.maxY=rows[rows.length-1].y}return Area.prototype.containsCell=function(pos){return Area.containsCell(this,pos)},Area.containsCell=function(area,pos){if(pos.y>=area.minY&&pos.y<area.maxY+1){var row=area.rows[Math.floor(pos.y)-area.minY];return pos.x>=row.x1&&pos.x<row.x2+1}return!1},Area}();Tesp.Area=Area}(Tesp||(Tesp={}));
//# sourceMappingURL=common.js.map