document.addEventListener('DOMContentLoaded', function() {
  // Load all images during loading
  loadImages();

  // Handle image upload
  document.getElementById('uploadForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const fileInput = document.getElementById('imageInput');
      if (!fileInput.files[0]) {
          alert('Please select an image to upload');
          return;
      }

      const formData = new FormData();
      formData.append('image', fileInput.files[0]);

      fetch('/upload', {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('Image uploaded successfully!');
              fileInput.value = '';
              loadImages(); // Refresh the image grid
          } else {
              alert('Error: ' + data.error);
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred while uploading the image');
      });
  });

  // Handle update form display
  document.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('update-btn')) {
          const imageId = e.target.getAttribute('data-id');
          document.getElementById('updateImageId').value = imageId;
          document.getElementById('updateFormContainer').classList.remove('hidden');
          // Position the form near the clicked button
          const rect = e.target.getBoundingClientRect();
          const formContainer = document.getElementById('updateFormContainer');
          formContainer.style.position = 'absolute';
          formContainer.style.top = (window.scrollY + rect.bottom + 10) + 'px';
          formContainer.style.left = rect.left + 'px';
      }
  });

  // Handle cancel update
  document.getElementById('cancelUpdate').addEventListener('click', function() {
      document.getElementById('updateFormContainer').classList.add('hidden');
  });

  // Handle image update
  document.getElementById('updateForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const imageId = document.getElementById('updateImageId').value;
      const fileInput = document.getElementById('updateImageInput');
      
      if (!fileInput.files[0]) {
          alert('Please select an image');
          return;
      }

      const formData = new FormData();
      formData.append('image', fileInput.files[0]);

      fetch(`/images/${imageId}`, {
          method: 'PUT',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('Image updated successfully!');
              document.getElementById('updateFormContainer').classList.add('hidden');
              loadImages(); // Refresh the image grid
          } else {
              alert('Error: ' + data.error);
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred while updating the image');
      });
  });

  // Handle image deletion
  document.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('delete-btn')) {
          if (confirm('Are you sure you want to delete this image?')) {
              const imageId = e.target.getAttribute('data-id');
              
              fetch(`/images/${imageId}`, {
                  method: 'DELETE'
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      alert('Image deleted successfully!');
                      loadImages(); // Refresh the image grid
                  } else {
                      alert('Error: ' + data.error);
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  alert('An error occurred while deleting the image');
              });
          }
      }
  });
});

// Function to load all images
function loadImages() {
  const imageGrid = document.getElementById('imageGrid');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Show loading indicator
  imageGrid.innerHTML = '';
  loadingIndicator.classList.remove('hidden');
  
  fetch('/images')
      .then(response => response.json())
      .then(images => {
          loadingIndicator.classList.add('hidden');
          
          if (images.length === 0) {
              imageGrid.innerHTML = '<p>No images uploaded yet.</p>';
              return;
          }
          
          // For each image ID, fetch the full image data
          images.forEach(image => {
              fetch(`/images/${image.id}`)
                  .then(response => response.json())
                  .then(imageData => {
                      const imageCard = createImageCard(imageData);
                      imageGrid.appendChild(imageCard);
                  })
                  .catch(error => {
                      console.error('Error fetching image details:', error);
                  });
          });
      })
      .catch(error => {
          loadingIndicator.classList.add('hidden');
          console.error('Error fetching images:', error);
          imageGrid.innerHTML = '<p>Error loading images. Please try again later.</p>';
      });
}

//  create an image card
function createImageCard(imageData) {
  const card = document.createElement('div');
  card.className = 'image-card';
  
  // Create image timestamp 
  const heading = document.createElement('h3');
  heading.textContent = `Image #${imageData.id}`;
  card.appendChild(heading);
  
  // Create container for the image 
  const imagePair = document.createElement('div');
  imagePair.className = 'image-pair';
  
  // Create container for original image
  const originalContainer = document.createElement('div');
  originalContainer.className = 'image-container';
  const originalTitle = document.createElement('p');
  originalTitle.textContent = 'Original';
  originalContainer.appendChild(originalTitle);
  
  const originalImg = document.createElement('img');
  originalImg.src = `data:image/jpeg;base64,${imageData.raw_image}`;
  originalImg.alt = 'Original Image';
  originalContainer.appendChild(originalImg);
  
  // Create container for processed image
  const processedContainer = document.createElement('div');
  processedContainer.className = 'image-container';
  const processedTitle = document.createElement('p');
  processedTitle.textContent = 'Processed (64x64 Grayscale)';
  processedContainer.appendChild(processedTitle);
  
  const processedImg = document.createElement('img');
  processedImg.src = `data:image/jpeg;base64,${imageData.processed_image}`;
  processedImg.alt = 'Processed Image';
  processedContainer.appendChild(processedImg);
  
  // Add both image containers to the pair
  imagePair.appendChild(originalContainer);
  imagePair.appendChild(processedContainer);
  card.appendChild(imagePair);
  
  // Create buttons for update and delete
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'buttons';
  
  const updateBtn = document.createElement('button');
  updateBtn.className = 'update-btn';
  updateBtn.textContent = 'Update';
  updateBtn.setAttribute('data-id', imageData.id);
  buttonContainer.appendChild(updateBtn);
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('data-id', imageData.id);
  buttonContainer.appendChild(deleteBtn);
  
  card.appendChild(buttonContainer);
  
  return card;
}