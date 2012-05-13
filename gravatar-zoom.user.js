// ==UserScript==
// @name        Gravatar Zoom
// @icon        128.png
// @version     1.0
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
      , p = i.offsetParent
      , w = i.width
      , h = i.height

      , $i = $(i)
      , $z = $(i.cloneNode(false)).addClass('gravazoom')

      , base_url = i.src.split('?')[0]
      , query    = unparam(i.src.replace(/^[^?]*\??/, '?'))
      , size     = Number(query.s || 80)
      , refetch  = (size < DONT_ZOOM) && (query.s = ZOOM_SIZE) &&
                     base_url +'?'+ $.param(query)
      , zoom_sz  = refetch ? ZOOM_SIZE : size
      ;

    // when the original gravatar is (un)hovered, (un)zoom our $z replica
    $i.mouseenter(grow)
      .mouseleave(shrink);

    function grow() {
      var delta = (zoom_sz - Math.min(size, w)) >> 1
        ;
      if (refetch) { // didn't already have a large size loaded
        $z.attr('src', refetch);
        refetch = false;
      }
      $z.hide().appendTo(p);
      move().show();
      // animate:
      $z.css({ top: (i.offsetTop - delta) +'px'
             , left: (i.offsetLeft - delta) +'px'
             , width: zoom_sz +'px'
             , height: zoom_sz +'px'
             });
    }

    function shrink() {
      move({ width: w +'px'
           , height: h +'px'
           })
        .one(ANIM_DONE, remove);
    }

    function remove() {
      $z.remove();
    }

    // moves the zoom node to wherever the gravatar is now + mirrors its looks
    function move(css) {
      return $z.css($.extend({ top: i.offsetTop +'px'
                             , left: i.offsetLeft +'px'
                             , border: $i.css('border')
                             , padding: $i.css('padding')
                             , outline: $i.css('outline')
                             , position: 'absolute'
                             , 'z-index': 2147483646
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
