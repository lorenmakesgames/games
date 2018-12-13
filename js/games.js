$(document).ready(function(){
    $(".card_image img").click(function(){
        console.log("clicked");
        $(".modal").removeClass("modalActive");
        $(this).closest(".game_card").find(".modal").addClass("modalActive");
        $(this).closest(".game_card").find(".modal").draggable();

    });

    $(".close").click(function(){
        $(this).closest(".modal").removeClass("modalActive");
    });
});