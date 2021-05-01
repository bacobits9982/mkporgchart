import { useEffect, useState } from "react";
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

import styles from './CirclePack.module.css';

function getDiameter(container) {
  const width = document.getElementById(container).offsetWidth;
  const height = document.getElementById(container).offsetHeight;
  return (width > height ? (height - 50) : width);
}

const CirclePack = ({ onRoleChange }) => {
  const margin = 35;
  const circlePadding = 1.5;
  const nodePow = 3;
  /* IDs and classes */
  const container = 'content';
  const hoverClass = 'hover';
  const activeClass = 'active';
  const visitedClass = 'visited';
  const evenClass = 'even';
  const oddClass = 'odd';
  const nodeClass = 'node';
  const leafClass = 'leaf';
  const rootClass = 'root';
  const siteTitle = "Springest Roles";
  let title, focus, view;
  let pack, colorgrey, diameter, svg, tip, color;
  let circle, node;

  const getDepth = (obj) => {
    let depth = 0;
    if (obj.children) {
      obj.children.forEach(function (d) {
        const tmpDepth = getDepth(d);
        if (tmpDepth > depth) {
          depth = tmpDepth;
        }
      });
    }
    return 1 + depth;
  }

  const addPlaceholders = (node) => {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        addPlaceholders(child);
      }
      if (node.children.length === 1) {
        node.children.push({
          role_name: '===placeholder===',
          children: [{
            role_name: '===placeholder===',
            children: []
          }]
        });
      }
    }
  }

  const removePlaceholders = (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.role_name === '===placeholder===') {
        nodes.splice(i, 1);
      } else if (node.children) {
        removePlaceholders(node.children);
      }
    }
  }

  const reposition = (node, offset) => {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        node.children[i].x += offset;
        reposition(node.children[i], offset);
      }
    } else {
      node.children = [];
    }
  }

  const updateURL = (url, title) => {
    window.history.pushState('', title, url);
    // set the title of the document (for browser history)
    window.document.title = title;
  }

  const updateTitleAndURL = (node) => {
    // URL can already have a anchor, so remove that first
    let url = window.location.href.substr(0, window.location.href.indexOf('#'));

    url = url + '#' + node.role_id;

    title = node.role_name + ' | ' + siteTitle;
    updateURL(url, title);
  }


  const centerNodes = (nodes) => {

    for (let i = 0; i < nodes.length; i++) {

      const node = nodes[i];

      if (node.children) {
        if (node.children.length === 1) {
          const offset = node.x - node.children[0].x;
          node.children[0].x += offset;
          reposition(node.children[0], offset);
        }
      } else {
        node.children = [];
      }
    }
  }

  const drawCircle = (nodes) => {
    let nodeTree = 0;

    // Returns directly the circle. This isn't really elegant for code quality but it saves memory.
    return svg.selectAll("circle").data(nodes) // getting the data for every node
      .enter() // this is the D3 foreach loop
      .append("circle") // building the circle for each data node
      .attr("class", function (d) {

        // set class to node and to leaf (for endpoints) or to root (for stem)
        let output = nodeClass + (d.parent ? d.children.length > 0 ? '' : ' ' + leafClass : ' ' + rootClass);

        // set class to even or to odd, based on its level;        
        //output += ((d.depth % 2) === 0 ? ' ' + evenClass : ' ' + oddClass);
        output += " depth" + d.depth

        return output;
      }).attr("r", function (d) {

        return d.r;
      }).style("fill", function (d) {

        // Setting the color based on the hierarchy
        if (d.depth === 1) {
          nodeTree++;
        }

        if (d.children || d.depth === 1) {
          if ((d.depth % 2) === 0) {
            return color(nodeTree);
          } else {
            const tempColor = d3.hsl(color(nodeTree));
            const newColor = d3.hsl('hsl(' + tempColor.h + "," + (tempColor.s * 100 * 1.09) + "%," + (tempColor.l * 100 * 1.2) + '%)');

            return newColor;
          }
        } else {
          return null;
        }
      });
  }

  const zoom = (d) => {

    let zoomNode;

    let focus0 = focus;
    focus = d;

    setPath(d);

    updateTitleAndURL(focus);

    // Do nothing when the old is the new focus
    if (focus === focus0) {
      return;
    }

    if (focus.children.length > 0) {
      zoomNode = focus;
    } else {
      zoomNode = focus.parent;
    }

    // interpolates the Zoom from current focused node to target node d
    const transition = d3.transition().duration(750).tween("zoom", function () {

      const i = d3.interpolateZoom(view, [zoomNode.x, zoomNode.y, zoomNode.r * 2]);

      return function (t) {

        zoomTo(i(t));
      };
    });

    // Arranges which labels are shown
    transition.selectAll("g.label").filter(function (d) {

      return d.parent === zoomNode || this.style.display === "inline";
    }).style("opacity", function (d) {

      return d.parent === zoomNode ? 1 : 0;
    }).each("start", function (d) {

      if (d.parent === zoomNode) {
        this.style.display = "inline";
      }
    }).each("end", function (d) {

      if (d.parent !== zoomNode) {
        this.style.display = "none";
      }
    });
    onRoleChange(focus);
  }

  const hasClass = (ele, className) => {
    if( ele.className.baseVal.indexOf(className) == -1 )
      return false

    return true
  }

  const getClass = (ele, className) => {    
    let pos = ele.className.baseVal.indexOf(className)

    if( pos == -1 )
      return ""

    const classes = ele.className.baseVal.split(' ')

    for(let i = 0; i < classes.length; i++) {
      if( classes[i].indexOf(className) != -1 )
        return classes[i]
    }

    return ""
  }

  const zoomTo = (v) => {

    const k = diameter / v[2];
    view = v;

    // Set the active node by attaching the class 'active'
    node.classed(activeClass, false).filter(function (d) {
      return focus === d;
    }).classed(activeClass, true);

    node.attr("transform", function (d) {

      return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
    });

    circle.attr("r", function (d) {
      return d.r * k;
    });
    const activeNode = d3.select('circle.active')[0][0];
    if (activeNode) {
      let leafRadius = 0;
      let nodeRadius = 0;
      let depth = getClass(activeNode, 'depth')
      if( depth != "" ) {
        if( hasClass(activeNode, 'leaf') ) {
          leafRadius = activeNode.r.baseVal.value;

          const noLeafNode = d3.select('circle.'+depth+':not(.leaf)')[0][0];
          if( noLeafNode ) {
            nodeRadius = noLeafNode.r.baseVal.value;
          }
        } else {
          depth = "depth" + (parseInt(depth.substring(5)) + 1);
          
          const noLeafNode = d3.select('circle.'+depth+':not(.leaf)')[0][0];
          if( noLeafNode ) {
            nodeRadius = noLeafNode.r.baseVal.value;
          }

          const leafNode = d3.select('circle.'+depth+'.leaf')[0][0];
          if( leafNode ) {
            leafRadius = leafNode.r.baseVal.value;
          }
        }
        d3.selectAll("foreignObject.leaf." + depth)
          .attr("width", leafRadius * 2)
          .attr("x", -leafRadius)
          .attr("height", leafRadius * 2)
          .attr("y", -leafRadius)
        
        d3.selectAll("foreignObject." + depth + ":not(.leaf)")
          .attr("width", nodeRadius * 2)
          .attr("x", -nodeRadius)
          .attr("height", nodeRadius * 2)
          .attr("y", -nodeRadius)
      }
    }
  }
  
  const registerInteractions = (root) => {

    /**
     * Window Arrangements
     */

    // Resizing the window
    d3.select(window).on('resize', function () {

      setSize();
    });

    /**
     * Basic Visualization interactions
     */

    // Zoom out when user clicks on container
    d3.select('#' + container) // .style("background", color(-1))
      .on("click", function () {

        zoom(root);
      });

    // Mouse Events on circles
    let tipShow;

    circle.on("click", function (d) {
      tip.attr('class', 'd3-tip');
      tip.hide(d, this);
      d3.select(this).classed(visitedClass, true);
      if (focus !== d) {
        zoom(d);
        d3.event.stopPropagation();
      } else if (d.parent != null) {
        zoom(d.parent);
        d3.event.stopPropagation();
      }
    }).on('mouseover', function (d) {

      tip.show(d, this);

      tipShow = setTimeout(function () {

        tip.attr('class', 'd3-tip show');
      }, 300);
    }).on('mouseout', function (d) {

      clearTimeout(tipShow);
      tip.attr('class', 'd3-tip');
      tip.hide(d, this);
    });

    // Prevent Zooming to input field (just for mobile devices)
    d3.selectAll('input').on("focus", function () {

      d3.event.preventDefault();
    });

  }


  const drawLabels = (nodes,root) => {
      // Returning directly the Label
      return svg.selectAll("g.label")
        .data(nodes)
        .enter() // this is the D3 foreach loop
        .append("g")
        .attr("class", "label")
        .style("opacity", function (d) {
  
          return d.parent === root ? 1 : 0;
        })
        .style("display", function (d) {
  
          return d.parent === root ? "inline" : 'none';
        })
        .attr("transform", "translate(0," + window.innerHeight + ")")
        .append("foreignObject")
        .attr("class", function (d) { 
          let className = "depth" + d.depth 
          className += d.children.length === 0 ? ' leaf' : ''
          return className
        })
      // Using the SVG foreignObject to use the wrapping functionality of HTML elements
        .attr("width", 200)
        .attr("x", -200/2)
        .attr("height", 200)
        .attr("y", -200/2)
        .append("xhtml:div")
        .classed('labelContainer', true)
        .html(function (d) {
          let content = '<div><span>' + d.role_name + '</span>';
          if (d.soul_name) {
            content += '<a class="soul-link" target="_blank" href="' + d.soul_mkpconnect_link + '">(' + d.soul_name + ')</a></div>';
          }
          return content;
        });
    }

  const setSize = () => {

    // Disable overflow scrolling (hack)
    d3.select('body').style('position', 'relative');
    // update variables
    const width = document.getElementById(container).offsetWidth;
    const height = document.getElementById(container).offsetHeight;

    // reset the sizes
    d3.select('#' + container).select('svg').style('width', width + 'px').style('height', height + 'px').select('g').attr('transform', 'translate(' + ((width) / 2) + ',' + ((height / 2) + (margin / 2)) + ')');
    // centering

    // Apply overflow scrolling hack for iOS
    d3.select('body').style('position', 'fixed');

  }
  
  const getParentPath = (d, container) => {
    if (d.parent == null)
      return;
    d = d.parent;

    container.insert('span', ':first-child').attr('class', 'divider');

    const title = ((d.depth + 2) > focus.depth || d.depth < 2) ? d.role_name : '···';

    container.insert('button', ':first-child').text(title).on('click', function () {

      zoom(d);
    }).on('mouseover', function () {

      if (title === '···') {
        d3.select(this).classed('show-tip', true);
      }
      circle.filter(function (d2) {

        return d === d2;
      }).classed(hoverClass, true);
    }).on('mouseout', function () {

      if (title === '···') {
        d3.select(this).classed('show-tip', false);
      }
      circle.filter(function (d2) {

        return d === d2;
      }).classed(hoverClass, false);
    }).append('span').text(d.role_name).classed('path-tip', true).attr('style', function () {

      return 'margin-left: -' + d3.select(this).node().getBoundingClientRect().width / 2 + 'px';
    });

    getParentPath(d, container);
  }

  const setPath = (d) => {
    const container = d3.select('#path .content');
    container.html('');
    container.append('span').attr('class', activeClass).text(d.role_name);

    // start the recursive call
    getParentPath(d, container);
  }

  const init = (fileURL) => {
    let nodes;

    d3.json(fileURL, function (error, { data }) {
      var lookup = {};
      data.circles.forEach(circle => {        
        lookup[circle.circle_id] = circle;
        circle.children = [];
      });

      var root = null;
      data.circles.forEach(circle => {
        if( circle.parent !== null ) {
          if (lookup[circle.parent] !== undefined) {
            lookup[circle.parent].children.push(circle);
          }
        } else {
          root = circle;
        }
        
        circle.role_name = circle.circle_name
        circle.role_id = circle.circle_id

        data.roles.map(role => {
          if( role.circle_id === circle.circle_id ) 
            circle.children.push(role)
        })
      });

      // Set sizes of the UI
      setSize();
      setPath(root);

      /* Initialize the data */

      // Adding placeholders if a node has just one child
      // This extends the radius of the parent node
      addPlaceholders(root);

      // dynamic variables to calculate the visualization
      focus = root;
      // Set the focus to the root node
      nodes = pack.nodes(root);
      // Packing every node into a circle packing layout

      // Set the maximum color domain dimension by recursively calculate it
      // This is needed to set the maximum level of interpolations
      colorgrey.domain([0, getDepth(root)]);

      // Removing the placeholders
      removePlaceholders(nodes);
      // Centering the one child nodes
      centerNodes(nodes);

      /* Building the visuals */

      circle = drawCircle(nodes);

      drawLabels(nodes, root);

      /* Initialize Interactions */
      registerInteractions(root);

      /* Arrangement and initialization */

      // Register the nodes
      node = svg.selectAll("circle,g.label");

      // Set initial zoom to root
      if (window.location.href.indexOf('#') !== -1) {
        // find the id
        const href = window.location.href;
        const slug = href.substr(href.indexOf('#') + 1, href.length);

        zoomTo([root.x, root.y, root.r * 2 + margin]);

        const focus_node = nodes.find(function (d) {
          return d.role_id == slug;
        })
        zoom(focus_node);
      } else {
        zoomTo([root.x, root.y, root.r * 2 + margin]);
      }
    });
  }

  useEffect(() => {
    const $container = d3.select("#" + container);
    diameter = getDiameter(container);
    color = d3.scale.ordinal().range(["#EF721F", "#4E9CEE", "#36D63D", "#DEC815", "#E076E7", "#75AE29", "#E8A117", "#39CD68", "#A886F2", "#C985D6", "#CA8025", "#ABA414", "#F46841", "#A0CB1C", "#50AB46", "#75CE2F", "#8E94E8", "#33B22E", "#61D350", "#E58222"]);
    colorgrey = d3.scale.linear().domain([0, 8]).range(["#FCFCFC", "#D4D4D4"]).interpolate(d3.interpolateRgb);
    pack = d3.layout.pack().padding(circlePadding) // set the node padding
      .size([diameter - margin, diameter - margin]) // set the visual size
      .value(function (d) {
        // Calculating the size of each node, based on its depth.
        return Math.pow(1 / d.depth, nodePow);
      }).sort(function (a, b) {
        // Changing Sort
        // Source: http://stackoverflow.com/questions/20736876/controlling-order-of-circles-in-d3-circle-pack-layout-algorithm
        return -(a.value - b.value);
      });
  
    svg = $container.append("svg").append("g");
    tip = d3Tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
      return d.role_name;
    });
    svg.call(tip);
  
    init('https://circular-packing-backend.herokuapp.com/api/data');
    //init('http://localhost:8000/api/data');
  }, []);

  return (
    <div id="content" className={styles.content}></div>
  );
}

export default CirclePack;