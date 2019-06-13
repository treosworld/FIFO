$(function() {
  console.log("unclick");
  $(".UserID-Submit-button").click(function() {
    LoggedinUserId = $(".user-id-box").val();
    console.log(LoggedinUserId);
    localStorage["UserId"] = JSON.stringify(LoggedinUserId);
  });
});