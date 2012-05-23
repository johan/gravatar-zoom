// ==UserScript==
// @name        Gravatar Zoom
// @icon        128.png
// @version     1.6
// @namespace   https://github.com/johan/
// @description Hover gravatar images anywhere on the web to zoom them up.
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @run-at      document-end
// @match       https://*/*
// @match       http://*/*
// ==/UserScript==

var PREFIXES    = ['', '-webkit-', '-moz-', '-o-', '-ms-']
  , DONT_ZOOM   = 128 // already loaded >= DONT_ZOOM images don't need zooming
  , ZOOM_SIZE   = 512
  , IS_GRAVATAR = /^[^\/]*\/\/([^\/]*\.)?gravatar\.com\/avatar\/[0-9a-f]{32}/
  , UA          = navigator.userAgent
  , ANIM_DONE   = /WebKit/.test(UA) ? 'webkitTransitionEnd' :
                  /opera/i.test(UA) ? 'oTransitionEnd' : 'transitionend' // Fx
  ;

// we want a guarantee that all gravatars are loaded before we peek at them
$(window).load(init);

function prefix_rule(rule) {
  return PREFIXES.map(function(browser) { return browser + rule; }).join('');
}

function init() {
  var count = 0;

  $('img[src*="gravatar.com/avatar/"]').each(function zoom_on_hover(n) {
    if (this.width >= DONT_ZOOM ||
        !IS_GRAVATAR.test(this.src)) return;

    var i = this
      , w = i.width
      , h = i.height

      , $i = $(i)
      , $z = $(i.cloneNode(false)).addClass('gravazoom')

      , base_url = i.src.split('?')[0]
      , query    = unparam(i.src.replace(/^[^?]*\??/, '?'))
      , size     = Number(query.size || query.s || 80)
      , refetch  = (size < DONT_ZOOM) && (query.size = ZOOM_SIZE) &&
                     base_url +'?'+ $.param(query)
      , zoom_sz  = refetch ? ZOOM_SIZE : size
      ;

    // when the original gravatar is (un)hovered, (un)zoom our $z replica
    $i.mouseenter(grow)
      .mouseleave(shrink);

    // TODO: bound coords and max size to fit document boundaries?
    function grow() {
      var delta  = -((zoom_sz - Math.min(size, w)) >> 1)
        , margin = delta +'px 0 0 '+ delta +'px'
        ;
      if (refetch) { // didn't already have a large size loaded
        $z.attr('src', refetch);
        refetch = false;
      }
      $z.hide().appendTo(document.body);
      move(getViewOffset(i)).show();

      // while we're animating our copy, hide the original, which might shine
      // through in transparent spots:
      $(this).css('opacity', '0');

      // animate:
      $z.css({ width: zoom_sz +'px'
             , height: zoom_sz +'px'
             , margin: margin
             });
    }

    function shrink() {
      move({ width: w +'px'
           , height: h +'px'
           , margin: '0px 0 0 0px'
           })
        .one(ANIM_DONE, remove.bind(this));
    }

    function remove() {
      $z.remove();
      $(this).css('opacity', '');
    }

    // moves the zoom node to wherever the gravatar is now + mirrors its looks
    function move(css) {
      return $z.css($.extend({ border: $i.css('border')
                             , padding: $i.css('padding')
                             , outline: $i.css('outline')
                             , position: 'absolute'
                             , 'z-index': 2147483646
                             , 'max-width': ZOOM_SIZE +'px'
                             , 'max-height': ZOOM_SIZE +'px'
                             }, css || {}));
    }
    ++count;
  });

  if (count)
    $( '<style>.gravazoom { '
     + prefix_rule('pointer-events: none; ')
     + prefix_rule('transition: .125s all linear; ')
     + '}</style>'
     ).appendTo('head');
}

function unparam(str, alt) {
  var data = {}, empty = true;
  (str || '').replace(/\+/g, '%20').split('&').forEach(function(kv) {
    kv = /^\??([^=]*)=(.*)/.exec(kv);
    if (!kv) return;
    var prop, val, k = kv[1], v = kv[2], e, m;
    try { prop = decodeURIComponent(k); } catch (e) { prop = unescape(k); }
    try { val  = decodeURIComponent(v); } catch (e) { val  = unescape(v); }
    data[prop] = val;
    empty      = false;
  });
  return empty && 'undefined' !== typeof alt ? alt : data;
}

function getViewOffset(node) {
  var x = 0, y = 0, win = node.ownerDocument.defaultView;
  if (node) addOffset(node);
  return { top: y, left: x };

  function addOffset(node) {
    var p = node.offsetParent, style, X, Y, name;
    x += parseInt(node.offsetLeft, 10) || 0;
    y += parseInt(node.offsetTop, 10) || 0;

    if (p) {
      x -= parseInt(p.scrollLeft, 10) || 0;
      y -= parseInt(p.scrollTop, 10) || 0;

      if (p.nodeType == 1) {
        var parentStyle = win.getComputedStyle(p, '')
          , localName   = p.localName
          , parent      = node.parentNode;
        if (parentStyle.position != 'static') {
          x += parseInt(parentStyle.borderLeftWidth, 10) || 0;
          y += parseInt(parentStyle.borderTopWidth, 10) || 0;

          if (localName == 'TABLE') {
            x += parseInt(parentStyle.paddingLeft, 10) || 0;
            y += parseInt(parentStyle.paddingTop, 10) || 0;
          }
          else if (localName == 'BODY') {
            style = win.getComputedStyle(node, '');
            x += parseInt(style.marginLeft, 10) || 0;
            y += parseInt(style.marginTop, 10) || 0;
          }
        }
        else if (localName == 'BODY') {
          x += parseInt(parentStyle.borderLeftWidth, 10) || 0;
          y += parseInt(parentStyle.borderTopWidth, 10) || 0;
        }

        while (p != parent) {
          x -= parseInt(parent.scrollLeft, 10) || 0;
          y -= parseInt(parent.scrollTop, 10) || 0;
          parent = parent.parentNode;
        }
        addOffset(p, win);
      }
    }
    else {
      if (node.localName == 'BODY') {
        style = win.getComputedStyle(node, '');
        x += parseInt(style.borderLeftWidth, 10) || 0;
        y += parseInt(style.borderTopWidth, 10) || 0;

        var htmlStyle = win.getComputedStyle(node.parentNode, '');
        x -= parseInt(htmlStyle.paddingLeft, 10) || 0;
        y -= parseInt(htmlStyle.paddingTop, 10) || 0;
      }

      if ((X = node.scrollLeft)) x += parseInt(X, 10) || 0;
      if ((Y = node.scrollTop))  y += parseInt(Y, 10) || 0;
    }
  }
}
