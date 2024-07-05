$(function () {
  var bodyRect = d3.select("body").node().getBoundingClientRect();
  var margin = { top: 50, right: 150, bottom: 30, left: 150 };

  var width = bodyRect.width - margin.right - margin.left - 20;
  var height = bodyRect.height - margin.top - margin.bottom;

  var tree = d3.layout.tree().size([width, height]);

  var svg = d3.select("#canvas")
    .append("svg")
    .attr({
      width: width + margin.right + margin.left,
      height: height + margin.top + margin.bottom,
    })
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var bTree, treeData;

  bTree = BTree(3);
  $("#order-display").html(3);

  $("#add-form").submit(function (event) {
    event.preventDefault();
    var value = parseInt($("#input-add").val());
    if (!value || value <= 0) {
      alert("Entrada inválida!");
      return;
    }

    bTree.insert(value, false);

    $("#input-add").val("");
    $(".seed-btree").prop("disabled", true);
    $(".seed-btree-input").prop("disabled", true);

    treeData = bTree.toJSON();
    update(treeData);

    $("g text").each(function (index) {
      var bTreeNode = bTree.search(value);
      var d3NodeTouched = d3.selectAll("g.node").filter(function (d) {
        return d.name === bTreeNode.keys.toString();
      });

      d3.selectAll("g.node").select("circle").style({ stroke: "#000000", fill: "#000000" });
      d3.selectAll(".link").style("stroke", "#000000");

      colorPath(bTreeNode);

      d3NodeTouched.select("circle").style({ stroke: "#000000", fill: "#000000" });
    });
  });

  $(".seed-btree").click(function (e) {
    e.preventDefault();
    var quantity = parseInt($("#quantity").val());
    if (!quantity || quantity <= 0) {
      alert("Entrada inválida!");
      return;
    }
    bTree.seed(quantity);
    var treeData = bTree.toJSON();
    update(treeData);
    $(".seed-btree").prop("disabled", true);
    $(".seed-btree-input").prop("disabled", true);
  });

  $(".reset-btree").click(function (e) {
    e.preventDefault();
    var order = parseInt($("#new-order").val());
    if (!order || order < 3) {
      alert("Entrada inválida!");
      return;
    }

    $("#input-add").val("");
    $("svg g").children().remove();
    $("#order-display").html(order);
    $(".seed-btree").prop("disabled", false);
    $(".seed-btree-input").prop("disabled", false);
    $(".reset-btree-input").val("");
    bTree = BTree(order);
  });

  $(".delete-btree").click(function (e) {
    e.preventDefault();
    var num = parseInt($("#input-add").val());
    if (!num || num <= 0) {
      alert("Entrada inválida!");
      return;
    }

    var deletado = bTree.delete(num);
    if (!deletado) {
      return;
    }

    $("#input-add").val("");
    $("svg g").children().remove();
    treeData = bTree.toJSON();
    update(treeData);

    // Restaurar cores padrão após exclusão
    d3.selectAll("g.node").select("circle").style({ stroke: "#000000", fill: "#000000" });
    d3.selectAll(".link").style("stroke", "#000000");

  });

  $(".search-btree").click(function (e) {
    e.preventDefault();
    var num = parseInt($("#input-add").val());
    if (!num || num <= 0) {
      alert("Entrada inválida!");
      return;
    }
    $("#input-add").val("");

    var bTreeNode = bTree.search(num, true);
    if (!bTreeNode) {
      alert("Não encontrado!");
      return;
    }

    $("g text").each(function (index) {
      var d3NodeTouched = d3.selectAll("g.node").filter(function (d) {
        return d.name === bTreeNode.keys.toString();
      });

      d3.selectAll("g.node").select("circle").style({ stroke: "#FFFFFF", fill: "#FFFFFF" });
      d3.selectAll(".link").style("stroke", "#FFFFFF");

      colorPath(bTreeNode);

      d3NodeTouched.select("circle").style({ stroke: "#14FF00", fill: "#14FF00" });
    });
  });

  function colorPath(node) {
    d3.selectAll("g.node").filter(function (d) {
      return d.name === node.keys.toString();
    }).select("circle").style("stroke", "#14FF00");

    if (node.isRoot()) return;
    else {
      d3.selectAll(".link").filter(function (d) {
        return d.target.name === node.keys.toString();
      }).style("stroke", "#14FF00");
      return colorPath(node.parent);
    }
  }

  function update(source) {
    var nodes = tree.nodes(source);
    var links = tree.links(nodes);

    nodes.forEach(function (d) {
      d.y = d.depth * 120;
    });

    var i = 0;
    var node = svg.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    var nodeEnter = node.enter().append("g")
      .attr({
        class: "node",
        id: function (d) {
          return "i" + d.id;
        },
      })
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    nodeEnter.append("circle")
      .attr("r", 12)
      .style("fill", "#000000")
      .style("opacity", 0)
      .transition()
      .style("opacity", 1)
      .duration(300);

    nodeEnter.append("text")
      .attr("y", function (d) {
        return d.children || d._children ? -20 : 20;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function (d) {
        return d.name;
      })
      .style("opacity", 0)
      .transition()
      .style("opacity", 1)
      .duration(300);

    node.each(function (d, i) {
      var thisNode = d3.select("#" + this.id + " text");
      thisNode.text(d.name);
      d3.select("#" + this.id)
        .transition()
        .attr("transform", "translate(" + d.x + "," + d.y + ")");

      thisNode.attr("y", d.children || d._children ? -20 : 20);
    });

    var link = svg.selectAll("path.link").data(links, function (d) {
      return d.target.id;
    });

    var diagonal = d3.svg.diagonal().projection(function (d) {
      return [d.x, d.y];
    });
    link.enter().insert("path", "g").attr("class", "link").attr("d", diagonal);

    link.each(function (d, i) {
      var thisLink = d3.select(svg.selectAll("path.link")[0][i]);
      diagonal = d3.svg.diagonal().projection(function (d) {
        return [d.x, d.y];
      });
      thisLink.transition().attr("d", diagonal);
    });
  }
});
