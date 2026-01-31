function toggle(){
    var blur = document.getElementById('blur');
    blur.classList.toggle('active');
    console.log(blur);

    var popup = document.getElementById('popup');
    popup.classList.toggle('active');
    console.log(popup);

    var blur1 = document.getElementById('blur1');
    blur1.classList.toggle('active');
    console.log(blur1);

    var blur2 = document.getElementById('blur2');
    blur2.classList.toggle('active');
    console.log(blur2);

    var blur3 = document.getElementById('blur3');
    blur3.classList.toggle('active');
    console.log(blur3);
}

document.addEventListener('DOMContentLoaded', function() {
    const selection = document.getElementById('selection');
    selection.addEventListener('change', updateImage);
    
    function updateImage() {
      const selectedValue = selection.value;
      const image = document.getElementById('previewImage');
      
      if (selectedValue === 'image1') {
        image.src = './uploads/Gender_Reveal_Event.jpg';
      } else if (selectedValue === 'image2') {
        image.src = './uploads/Baptismal_Event.jpg'; // Replace with actual path
      } else if (selectedValue === 'image3') {
        image.src = './uploads/Debut_Event.webp'; // Replace with actual path
      } else if (selectedValue === 'image4') {
        image.src = './uploads/Graduation_Ball.jpg'; // Replace with actual path
      } else if (selectedValue === 'image5') {
        image.src = './uploads/Outdoor_Wedding.jpg'; // Replace with actual path
      } else if (selectedValue === 'image6') {
        image.src = './uploads/Beach_Wedding.jpg'; // Replace with actual path
      } else if (selectedValue === 'image7') {
        image.src = './uploads/Anniversary_Event.jpg'; // Replace with actual path
      } else if (selectedValue === 'image8') {
        image.src = './uploads/Funeral_Event.jpeg'; // Replace with actual path
      } else if (selectedValue === 'image9') {
        image.src = './uploads/Birthday_Party.jpg'; // Replace with actual path
      } else if (selectedValue === 'image10') {
        image.src = './uploads/Welcome_Party.webp'; // Replace with actual path
      } else if (selectedValue === 'image11') {
        image.src = './uploads/Mothers_Day.jpg'; // Replace with actual path
      } else if (selectedValue === 'image12') {
        image.src = './uploads/Fathers_Day.png'; // Replace with actual path
      } else if (selectedValue === 'default') {
        image.src = './uploads/event_reservation_preview.png'; // Replace with actual path
      } else {
        image.src = './uploads/event_reservation_preview.png'; // Default image
      }
    }
  });