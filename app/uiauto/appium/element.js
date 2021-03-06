/*global au:true $:true codes:true UIAElementNil:true UIATarget:true UIAElement:true */
"use strict";

UIAElementNil.prototype.type = function() {
    return "UIAElementNil";
};

// this is mechanic notation for extending $(UIAElement)
$.extend($.fn, {
  getActiveElement: function() {
      var foundElement = null;
      var checkAll = function(element) {
        var children = $(element).children();
        children.each(function(e, child) {
          var focused = $(child).isFocused();
          if(focused === true || focused === 1) {
            return child;
          }
          if (child.hasChildren()) { // big optimization
            checkAll(child);
          }
        });

        return null;
      };
      // try au.cache in the array first
      for (var key in au.cache) {
        var elemFocused = $(au.cache[key]).isFocused();
        if (elemFocused === true || elemFocused === 1) {
          return {
            status: codes.Success.code,
            value: {ELEMENT: key}
          };
        }
      }
      foundElement = checkAll(this);

      if (foundElement) {
          var varName = $(foundElement).name();
          return {
            status: codes.Success.code,
            value: {ELEMENT: varName}
          };
      }

      return {
        status: codes.NoSuchElement.code,
        value: null,
      };
    }

});

UIAElement.prototype.type = function() {
  var type = this.toString();
  return type.substring(8, type.length - 1);
};

UIAElement.prototype.hasChildren = function() {
  var type = this.type();
  // NOTE: UIALink/UIAImage/UIAElement can have children
  return !(type === "UIAStaticText" || type === "UIATextField" ||
           type === "UIASecureTextField" || type === "UIAButton" ||
           type === "UIASwitch" || type === "UIAElementNil");
};

UIAElement.prototype.matchesTagName = function(tagName) {
  var type = this.type();
  // i.e. "UIALink" matches "link:
  return type.substring(3).toLowerCase() === tagName.toLowerCase();
};

UIAElement.prototype.matchesBy = function(tagName, text) {
  if (!this.matchesTagName(tagName))
    return false;
  if (text === '')
    return true;
  var name = this.name();
  if (name)
    name = name.trim();
  if (name === text)
    return true;
  var value = this.value();
  if (value)
    value = String(value).trim();
  return value === text;
};

UIAElement.prototype.getTree = function() {
  var target = UIATarget.localTarget();
  target.pushTimeout(0);
  var getTree = function(element) {
    var subtree = {
      name: element.name()
      , type: element.type()
      , label: element.label()
      , value: element.value()
      , rect: element.rect()
      , dom: typeof element.dom === "function" ? element.dom() : null
      , enabled: element.isEnabled() ? true : false
      , valid: element.isValid() ? true : false
      , visible: element.isVisible() ? true : false
      , children: []
    };
    var children = element.elements();
    var numChildren = children.length;
    for ( var i = 0; i < numChildren; i++) {
      var child = children[i];
      subtree.children.push(getTree(child));
    }
    return subtree;
  };
  var tree = getTree(this);
  target.popTimeout();
  return tree;
};


UIAElement.prototype.getPageSource = function() {
  return JSON.stringify(this.getTree());
};

UIAElement.prototype.getElementLocation = function() {
  return {
    status: codes.Success.code,
    value: this.rect().origin
  };
};

UIAElement.prototype.getElementSize = function() {
  return {
    status: codes.Success.code,
    value: this.rect().size
  };
};

UIAElement.prototype.isDisplayed = function() {
  return {
    status: codes.Success.code,
    value: this.isVisible() == 1
  };
};

// does a flick from a center of a specified element (use case: sliders)
UIAElement.prototype.touchFlick = function(xoffset, yoffset) {
  var options = {
    startOffset : {
      x : 0.5,
      y : 0.5
    },
    endOffset : {
      x : 0.5 + xoffset,
      y : 0.5 + yoffset
    }
  };

  this.flickInsideWithOptions(options);
  return {
    status: codes.Success.code,
    value: null
  };
};
