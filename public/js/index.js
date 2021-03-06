// These are the Global variables.
var $exampleText = $("#example-text");
var $exampleDescription = $("#example-description");
var $exampleImage = $("#input-img");
var $submitBtn = $("#submit");
var $submitBtnUploads = $("#uploads-submit");
var $exampleList = $("#example-list");

var $typeOf;
var $placeNameVal
var $price = $("#price");
var $tellMore = $("#tell-more");
let tookPicture = false;
let blob;
let webBlobString = [];
const $photo = $("#uploadMyImg");
let yelpObj;

// input variables
var input = document.querySelector('input[type=file]');
const inputCheck = document.querySelector("input");
const inputNumber = $('input[type=number]');
let photoStatus = false;
var postForm = $("#postForm");
var $placeName = $("#place");
var $itemName = $("#item");
const $meal = $("#meal"),
  $snack = $("#snack"),
  $inputImage = $("#input-img")

//camera vairables
const cameraView = document.querySelector("#camera--view"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = $("#camera--trigger"),
  camera = $("#camera")

//video constraints is the parameters you need to give the User Media.  Ours doesn't get audio
var constraints = {
  video: {
    facingMode: "environment"
  },
  audio: false
};

//start camera function
function cameraStart() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      //create a canvas that will hold the video data with the contraints
      camera.append(`<canvas id="camera--sensor"></canvas>`);

      //This streams the video
      track = stream.getTracks()[0];
      cameraView.srcObject = stream;
    })
    .catch(function (error) {
      console.error("Oops. Something is broken.", error);
    });
}

function capturePhoto(event) {
  event.preventDefault();
  tookPicture = true;
  var capPhoto = input.files[0];

  // take the current video stream and make the image as big as the stream
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  //this method is part of the webAPI
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);

  //assing the src of the image the data canvas
  $photo.attr("src", cameraSensor.toDataURL("image/png"));
  let dataURI = cameraSensor.toDataURL("image/png");

//This sections turns the image abouve and converts it into a blob so that it is passed to the server.
  blob = dataURItoBlob(dataURI);
  webBlobString.pop();
  webBlobString.push(blob);

  // Stop all video streams.
  cameraView.srcObject.getVideoTracks().forEach(track => track.stop());
}

function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {
    type: mimeString
  });
}

//This code looks at what is loaded into the input with the attribute type file and then applies the url link as SRC to the image
window.addEventListener("load", function () {
  document
    .querySelector('input[type="file"]')
    .addEventListener("change", function (event) {
      if (this.files && this.files[0]) {
        var img = document.querySelector("#uploadMyImg "); // $('img')[0]
        img.src = URL.createObjectURL(this.files[0]); // set src to file url

        img.onload = imageIsLoaded(event); // optional onload event listener
      }
    });
});

//This is never used but its is after the image is loaded you can do something.
function imageIsLoaded(e) {

}

$(document).on("change", $photo, function (event) {

  // console.log(event);
  // console.log(event.target.files);
});

// GETTING DATA FROM THE UPLOADS FORM----------------------------------
function yelpApiSearch(placeName) {
  var buisnessName = placeName;

  var myurl =
    "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=" +
    buisnessName +
    "&location=philadelphia";

  $.ajax({
    url: myurl,
    headers: {
      Authorization: "Bearer Vg_tGwpB5bMsOR-xCjAGY2NUvCf7CUy_6QVbCD-5pV_6zMJxrrAjOgUZUtkUUvgdBr_8g_7Cva_67x-k8kxWw8vu9gKt-GTphwj6CZenIjAggvyMAqUxFXTSfsjeXHYx"
    },
    method: "GET",
    dataType: "json",
    success: function (response) {
      yelpObj = {
        bName: response.businesses[0].name,
        restAdd: response.businesses[0].location.display_address,
        restLat: response.businesses[0].coordinates.latitude,
        restLong: response.businesses[0].coordinates.longitude,
        yelpUrl: response.businesses[0].url,
        typeOfPlace: response.businesses[0].categories[0].title
      };

      //The Save Example Method is what takes all the data from FORM and YELP and sends it to the server to be saved in sequelize
      API.saveExample().then(function () {
        refreshExamples();
      });
    }
  });
}
// ______________________________________________
// The API object contains methods for each kind of request we'll make
var API = {
// saveExample Method is what takes care of all the logic for uploading to server
  saveExample: function () {
    var formData = new FormData(postForm[0]);
    if (tookPicture) {
      //iterate through the object and create a key/value pair to append to formData
      for (const key in yelpObj) {
        formData.append(key, yelpObj[key]);
      }
      //get image from canvas
      formData.append("userPhoto", blob);
      tookPicture = false;
    } else {

      //iterate through the objectand create a key/value pair to append to formData
      for (const key in yelpObj) {
        formData.append(key, yelpObj[key]);
      }

      formData.append("photoBlob", $photo.attr("src"));
    }
    return $.ajax({
      type: "POST",
      enctype: "multipart/form-data",
      url: "/api/posts",
      data: formData,
      processData: false, // Important!
      contentType: false,
      cache: false,
      // data: JSON.stringify(example),
      success: function (returnData) {
        console.log(returnData);
        photoStatus = true;
      },
      error: function (err) {
        console.log("error", err);

      }
    }).then(
      function () {
        console.log("added new deal");
        // redirect to the final page,
        location.assign("/final");
      }
    );
  },
  getExamples: function () {
    return $.ajax({
      url: "api/posts",
      type: "GET"
    });
  },
  deleteExample: function (id) {
    return $.ajax({
      url: "api/posts/" + id,
      type: "DELETE"
    });
  }
};

// refreshExamples gets new examples from the db and repopulates the list -- we never use this, but it is good to keep just in case we want to do some sort of refresh
var refreshExamples = function () {
  API.getExamples().then(function (data) {
    var $examples = data.map(function (example) {
      var $a = $("<a>")
        .text(example.text)
        .attr("href", "/posts/" + example.id);

      var $li = $("<li>")
        .attr({
          class: "list-group-item",
          "data-id": example.id
        })
        .append($a);

      var $img = $("<img>").attr("src", example.img);

      var $button = $("<button>")
        .addClass("btn btn-danger float-right delete")
        .text("ｘ");

      $li.append($img);
      $li.append($button);

      return $li;
    });
  });

};

// handleFormSubmit is called whenever we submit a new example
// Save the new example to the db and refresh the list
var handleFormSubmitUploads = function (event) {
  event.preventDefault();

  let $typeOf = $('input[name="typeOf"]:checked').val();
  let $placeNameVal = $placeName.val().trim();
  let $itemNameVal = $itemName.val().trim();
  let $priceVal = $price.val().trim();

  if ($photo.attr("src") !== "//:0") {
    photoStatus = true;
  }

  if ($typeOf && $placeNameVal && $itemNameVal && $priceVal && photoStatus) {

    //make yelp call
    yelpApiSearch($placeNameVal);
  } else {
    swal("uh oh!", "Make sure you fill in all the values!", "error")
  }

  $exampleText.val("");
  $exampleDescription.val("");
};

// handleDeleteBtnClick is called when an example's delete button is clicked
// Remove the example from the db and refresh the list
var handleDeleteBtnClick = function () {
  var idToDelete = $(this)
    .parent()
    .attr("data-id");

  API.deleteExample(idToDelete).then(function () {
    refreshExamples();
  });
};

function currencyEval() {
  let value = $(this).val();

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  })

  //still workout how to dynamically stick currency
  let evaluated = formatter.format(value);
  value = evaluated;
}

function formatNumber(n) {
  // format number 1000000 to 1,234,567
  return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatCurrency(input, blur) {
  // appends $ to value, validates decimal side
  // and puts cursor back in right position.

  // get input value
  var input_val = input.val();

  // don't validate empty input
  if (input_val === "") {
    return;
  }

  // original length
  var original_len = input_val.length;

  // initial caret position 
  var caret_pos = input.prop("selectionStart");

  // check for decimal
  if (input_val.indexOf(".") >= 0) {

    // get position of first decimal
    // this prevents multiple decimals from
    // being entered
    var decimal_pos = input_val.indexOf(".");

    // split number by decimal point
    var left_side = input_val.substring(0, decimal_pos);
    var right_side = input_val.substring(decimal_pos);

    // add commas to left side of number
    left_side = formatNumber(left_side);

    // validate right side
    right_side = formatNumber(right_side);

    // On blur make sure 2 numbers after decimal
    if (blur === "blur") {
      right_side += "00";
    }

    // Limit decimal to only 2 digits
    right_side = right_side.substring(0, 2);

    // join number by .
    input_val = "$" + left_side + "." + right_side;

  } else {
    // no decimal entered
    // add commas to number
    // remove all non-digits
    input_val = formatNumber(input_val);
    input_val = "$" + input_val;

    // final formatting
    if (blur === "blur") {
      input_val += ".00";
    }
  }

  // send updated string to input
  input.val(input_val);

  // put caret back in the right position
  var updated_len = input_val.length;
  caret_pos = updated_len - original_len + caret_pos;
  input[0].setSelectionRange(caret_pos, caret_pos);
}

//THIS WAS initially used to reset the form, but we leave the page once submitted.  We could use this to retake a photo.
function resetForm($form) {
  $form.find('input:text, input:password, input:file, select, textarea').val('');

  $(".form-check-input input:radio, .form-check-input input:checkbox").each(function () {
    $(this).removeAttr("checked").removeAttr("selected");
  })

  $photo.attr("src", "");
  // $form.find('input:radio, input:checkbox')
  //   .removeAttr('checked').removeAttr('selected');

  document.removeChild(cameraView);
}

//Title case
function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

$exampleList.on("click", ".delete", handleDeleteBtnClick);
$submitBtnUploads.on("click", handleFormSubmitUploads);
// window.addEventListener("load", cameraStart, false);
cameraTrigger.on("click", capturePhoto);
inputNumber.on("keyup", currencyEval);

//ask to take the picture when you land on the page
$("#takeIMG").click(function (event) {
  event.preventDefault();
  cameraStart();
  $("#imgChoice").css("display", "none");
  $("#camera").css("display", "block");
});

//grab the input currency field
$("input[data-type='currency']").on({
  keyup: function () {
    formatCurrency($(this));
  },
  blur: function () {
    formatCurrency($(this), "blur");
  }
});

// 
$("input").change(function () {
  const trimmed = $(this).val().trim()

  if (trimmed) {
    $(this).attr("data-state", "valid")
  } else {
    $(this).attr("data-state", "invalid")
  }
})