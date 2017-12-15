APP.index = (function (APP) {

  function bindEvents() {
    console.log('index module has initiated');

  }

  function init() {
    bindEvents();
  }

  return {
    init: init
  };

})(APP);
