// TODO
document.addEventListener("paste", function (e) {
  var clipboardData = e.clipboardData || window.clipboardData;
  var items = clipboardData.items;

  for (var i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      var blob = items[i].getAsFile();
      var reader = new FileReader();

      reader.onload = function (event) {
        var img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          document.body.appendChild(canvas);
        };
      };

      reader.readAsDataURL(blob);
    }
  }
});
