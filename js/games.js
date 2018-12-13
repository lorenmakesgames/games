$(document).ready(function(){
    $(".card_image img").click(function(){
        console.log("clicked");
        $(this).closest(".game_card").find(".modal").toggleClass("modalActive");
    });

    $(".close").click(function(){
        $(this).closest(".modal").toggleClass("modalActive");
    });
});