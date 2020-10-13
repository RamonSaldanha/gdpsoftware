document.addEventListener("DOMContentLoaded", function(){

  function dropdown ( event ) {

    dropdownHide();

    const menuContextFileElement = event.path[2]; // elemento html selecionado pelo clique do botão direito
    const menuContextDocumentsElement = event.path[4]; // elemento html selecionado pelo clique do botão direito
    const menuContextOutDocumentsElement = event.path[3]; // elemento html selecionado pelo clique do botão direito
    const menuContextContentElement = event.path[0]; // elemento html selecionado pelo clique do botão direito
    // mostrar apenas os dropdowns menu context-file

    // botão direito em cima do arquivo
    if( menuContextFileElement.classList.contains("menu-context-file") ) {
      const dropdownEl = menuContextFileElement.querySelector(".dropdown-menu");
      var top = event.offsetY;
      var left = event.offsetX;
      // toogle () nativo do bootstrap e $() do jquery
      // um depende do outro pra funcionar
      $(dropdownEl).css({top:top,left: left}).toggle();
      
    }

    // botão direito nas laterias de um documento
    if( menuContextDocumentsElement.classList.contains("documents")  ) {
      var offset = $(menuContextDocumentsElement).offset();
      var top = (event.pageY - offset.top);
      var left = (event.pageX - offset.left);

      $('.options-right-click').css({top:top,left:left}).toggle();
    }
    // botão direito fora das laterais
    if(menuContextOutDocumentsElement.classList.contains("documents")) {
      var offset = $(menuContextOutDocumentsElement).offset();
      var top = (event.pageY - offset.top);
      var left = (event.pageX - offset.left);

      $('.options-right-click').css({top:top,left:left}).toggle();
    }

    // botão direito fora dos documentos
    if(menuContextContentElement.classList.contains("content")) {
      var offset = $(menuContextContentElement).offset();
      var top = (event.pageY - offset.top);
      var left = (event.pageX - offset.left);

      $('.options-right-click').css({top:top,left:left}).toggle();
    }

  }
  
  function dropdownHide ( ) {
    var elements = document.querySelectorAll(".dropdown-menu");
    Array.prototype.forEach.call(elements, function(el, i){
      if( el.style.display == "block" ) {
        $(el).toggle();
      }
    });
  }

  document.addEventListener ( "contextmenu", dropdown );
  document.addEventListener ( "click", dropdownHide );
});