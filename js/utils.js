if (typeof $ == 'undefined') {
  $ = function() {};
  $.bind = function(fn, context) {
    return function(){
      fn.call(context);
    }
  };
}
