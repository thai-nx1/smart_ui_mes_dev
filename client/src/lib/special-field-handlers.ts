/**
 * Các hàm xử lý cho các field đặc biệt như GPS, PHOTO, AUDIO_RECORD, SCREEN_RECORD
 */

interface FieldHandlerResponse {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Lấy vị trí GPS hiện tại
 */
export async function getGPSLocation(): Promise<FieldHandlerResponse> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        message: "Trình duyệt của bạn không hỗ trợ định vị",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
        });
      },
      (error) => {
        let errorMessage = "Không thể xác định vị trí";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Người dùng từ chối cấp quyền truy cập vị trí";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Thông tin vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            errorMessage = "Quá thời gian xác định vị trí";
            break;
        }
        
        resolve({
          success: false,
          message: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Chụp ảnh từ camera (video element)
 */
export async function takePhoto(): Promise<FieldHandlerResponse> {
  try {
    // Kiểm tra xem trình duyệt có hỗ trợ mediaDevices không
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        message: "Trình duyệt của bạn không hỗ trợ chụp ảnh",
      };
    }

    // Tạo hộp thoại chụp ảnh
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.zIndex = "9999";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    // Tạo video element để hiển thị camera
    const video = document.createElement("video");
    video.style.width = "100%";
    video.style.maxWidth = "640px";
    video.style.maxHeight = "480px";
    video.style.backgroundColor = "#000";
    video.style.borderRadius = "8px";
    video.autoplay = true;
    video.playsInline = true;
    modal.appendChild(video);

    // Tạo canvas để chụp ảnh từ video
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    modal.appendChild(canvas);

    // Tạo div chứa các nút
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.gap = "10px";
    modal.appendChild(buttonContainer);

    // Tạo nút chụp
    const captureButton = document.createElement("button");
    captureButton.textContent = "Chụp ảnh";
    captureButton.style.padding = "10px 20px";
    captureButton.style.backgroundColor = "#0ea5e9";
    captureButton.style.color = "white";
    captureButton.style.border = "none";
    captureButton.style.borderRadius = "4px";
    captureButton.style.cursor = "pointer";
    buttonContainer.appendChild(captureButton);

    // Tạo nút hủy
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Hủy";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.backgroundColor = "#f43f5e";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";
    buttonContainer.appendChild(cancelButton);

    // Thêm modal vào body
    document.body.appendChild(modal);

    // Khởi tạo stream
    let stream: MediaStream | null = null;

    return new Promise<FieldHandlerResponse>(async (resolve) => {
      try {
        // Yêu cầu quyền truy cập camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Ưu tiên camera sau
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        // Gán stream cho video
        video.srcObject = stream;

        // Xử lý sự kiện khi người dùng nhấn nút chụp
        captureButton.onclick = () => {
          // Đặt kích thước canvas bằng với kích thước thực của video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Vẽ frame hiện tại của video lên canvas
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Chuyển đổi canvas thành base64 data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            // Dừng stream và đóng modal
            cleanup();

            // Trả về kết quả thành công với dữ liệu ảnh
            resolve({
              success: true,
              data: dataUrl,
            });
          }
        };

        // Xử lý sự kiện khi người dùng nhấn nút hủy
        cancelButton.onclick = () => {
          // Dừng stream và đóng modal
          cleanup();

          // Trả về kết quả hủy
          resolve({
            success: false,
            message: "Người dùng đã hủy chụp ảnh",
          });
        };
      } catch (error) {
        console.error("Lỗi khi truy cập camera:", error);
        // Đóng modal
        cleanup();

        // Trả về kết quả lỗi
        resolve({
          success: false,
          message: "Không thể truy cập camera",
        });
      }
    });

    // Hàm cleanup để dừng stream và xóa modal
    function cleanup() {
      // Dừng stream nếu có
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Xóa modal
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  } catch (error) {
    console.error("Lỗi khi chụp ảnh:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi chụp ảnh",
    };
  }
}

/**
 * Ghi âm
 */
export async function recordAudio(): Promise<FieldHandlerResponse> {
  try {
    // Kiểm tra xem trình duyệt có hỗ trợ mediaDevices không
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        message: "Trình duyệt của bạn không hỗ trợ ghi âm",
      };
    }

    // Tạo hộp thoại ghi âm
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.zIndex = "9999";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    // Tạo div hiển thị thời gian
    const timerDisplay = document.createElement("div");
    timerDisplay.style.fontSize = "48px";
    timerDisplay.style.color = "white";
    timerDisplay.style.marginBottom = "20px";
    timerDisplay.textContent = "00:00";
    modal.appendChild(timerDisplay);

    // Tạo div hiển thị trạng thái
    const statusDisplay = document.createElement("div");
    statusDisplay.style.fontSize = "18px";
    statusDisplay.style.color = "white";
    statusDisplay.style.marginBottom = "30px";
    statusDisplay.textContent = "Nhấn 'Bắt đầu' để ghi âm";
    modal.appendChild(statusDisplay);

    // Tạo div chứa các nút
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    modal.appendChild(buttonContainer);

    // Tạo nút bắt đầu/dừng
    const recordButton = document.createElement("button");
    recordButton.textContent = "Bắt đầu";
    recordButton.style.padding = "10px 20px";
    recordButton.style.backgroundColor = "#0ea5e9";
    recordButton.style.color = "white";
    recordButton.style.border = "none";
    recordButton.style.borderRadius = "4px";
    recordButton.style.cursor = "pointer";
    buttonContainer.appendChild(recordButton);

    // Tạo nút hủy
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Hủy";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.backgroundColor = "#f43f5e";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";
    buttonContainer.appendChild(cancelButton);

    // Thêm modal vào body
    document.body.appendChild(modal);

    // Khởi tạo các biến
    let stream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let startTime: number = 0;
    let timerInterval: NodeJS.Timeout | null = null;
    let isRecording = false;

    return new Promise<FieldHandlerResponse>(async (resolve) => {
      try {
        // Yêu cầu quyền truy cập microphone
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Tạo MediaRecorder
        mediaRecorder = new MediaRecorder(stream);

        // Xử lý sự kiện khi có dữ liệu
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        // Xử lý sự kiện khi ghi âm kết thúc
        mediaRecorder.onstop = () => {
          // Tạo blob từ các chunk
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

          // Chuyển đổi blob thành base64 data URL
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;

            // Dừng stream và đóng modal
            cleanup();

            // Trả về kết quả thành công với dữ liệu âm thanh
            resolve({
              success: true,
              data: base64data,
            });
          };
        };

        // Xử lý sự kiện khi người dùng nhấn nút ghi âm/dừng
        recordButton.onclick = () => {
          if (!isRecording) {
            // Bắt đầu ghi âm
            audioChunks = [];
            mediaRecorder?.start();
            isRecording = true;
            recordButton.textContent = "Dừng";
            recordButton.style.backgroundColor = "#ef4444";
            statusDisplay.textContent = "Đang ghi âm...";

            // Bắt đầu đếm thời gian
            startTime = Date.now();
            timerInterval = setInterval(() => {
              const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
              const minutes = Math.floor(elapsedTime / 60)
                .toString()
                .padStart(2, "0");
              const seconds = (elapsedTime % 60).toString().padStart(2, "0");
              timerDisplay.textContent = `${minutes}:${seconds}`;
            }, 1000);
          } else {
            // Dừng ghi âm
            mediaRecorder?.stop();
            isRecording = false;
            statusDisplay.textContent = "Đang xử lý...";

            // Dừng đếm thời gian
            if (timerInterval) {
              clearInterval(timerInterval);
            }
          }
        };

        // Xử lý sự kiện khi người dùng nhấn nút hủy
        cancelButton.onclick = () => {
          // Dừng ghi âm nếu đang ghi
          if (isRecording && mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
          }

          // Dừng đếm thời gian
          if (timerInterval) {
            clearInterval(timerInterval);
          }

          // Dừng stream và đóng modal
          cleanup();

          // Trả về kết quả hủy
          resolve({
            success: false,
            message: "Người dùng đã hủy ghi âm",
          });
        };
      } catch (error) {
        console.error("Lỗi khi truy cập microphone:", error);
        // Đóng modal
        cleanup();

        // Trả về kết quả lỗi
        resolve({
          success: false,
          message: "Không thể truy cập microphone",
        });
      }
    });

    // Hàm cleanup để dừng stream và xóa modal
    function cleanup() {
      // Dừng đếm thời gian
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      // Dừng stream nếu có
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Xóa modal
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  } catch (error) {
    console.error("Lỗi khi ghi âm:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi ghi âm",
    };
  }
}

/**
 * Ghi màn hình
 */
export async function recordScreen(): Promise<FieldHandlerResponse> {
  try {
    // Kiểm tra xem trình duyệt có hỗ trợ getDisplayMedia không
    if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
      return {
        success: false,
        message: "Trình duyệt của bạn không hỗ trợ ghi màn hình",
      };
    }

    // Tạo hộp thoại ghi màn hình
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.bottom = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.padding = "15px";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.zIndex = "9999";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    // Tạo div hiển thị thời gian
    const timerDisplay = document.createElement("div");
    timerDisplay.style.fontSize = "20px";
    timerDisplay.style.color = "white";
    timerDisplay.style.marginRight = "20px";
    timerDisplay.textContent = "00:00";
    modal.appendChild(timerDisplay);

    // Tạo div hiển thị trạng thái
    const statusDisplay = document.createElement("div");
    statusDisplay.style.fontSize = "16px";
    statusDisplay.style.color = "white";
    statusDisplay.style.marginRight = "20px";
    statusDisplay.style.flexGrow = "1";
    statusDisplay.textContent = "Đang ghi màn hình...";
    modal.appendChild(statusDisplay);

    // Tạo nút dừng
    const stopButton = document.createElement("button");
    stopButton.textContent = "Dừng";
    stopButton.style.padding = "8px 16px";
    stopButton.style.backgroundColor = "#ef4444";
    stopButton.style.color = "white";
    stopButton.style.border = "none";
    stopButton.style.borderRadius = "4px";
    stopButton.style.cursor = "pointer";
    modal.appendChild(stopButton);

    // Tạo nút hủy
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Hủy";
    cancelButton.style.padding = "8px 16px";
    cancelButton.style.backgroundColor = "#f43f5e";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.marginLeft = "10px";
    cancelButton.style.cursor = "pointer";
    modal.appendChild(cancelButton);

    // Khởi tạo các biến
    let stream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let videoChunks: Blob[] = [];
    let startTime: number = 0;
    let timerInterval: NodeJS.Timeout | null = null;

    return new Promise<FieldHandlerResponse>(async (resolve) => {
      try {
        // Yêu cầu quyền truy cập màn hình
        stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: {
            cursor: "always",
            frameRate: 30,
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        // Xử lý khi người dùng dừng chia sẻ màn hình bằng cách nhấn nút "Stop sharing" của trình duyệt
        stream.getVideoTracks()[0].onended = () => {
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        };

        // Thêm modal vào body sau khi đã có quyền truy cập màn hình
        document.body.appendChild(modal);

        // Tạo MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm; codecs=vp9",
        });

        // Xử lý sự kiện khi có dữ liệu
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunks.push(event.data);
          }
        };

        // Xử lý sự kiện khi ghi màn hình kết thúc
        mediaRecorder.onstop = () => {
          // Tạo blob từ các chunk
          const videoBlob = new Blob(videoChunks, { type: "video/webm" });

          // Chuyển đổi blob thành base64 data URL
          const reader = new FileReader();
          reader.readAsDataURL(videoBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;

            // Dừng stream và đóng modal
            cleanup();

            // Trả về kết quả thành công với dữ liệu video
            resolve({
              success: true,
              data: base64data,
            });
          };
        };

        // Bắt đầu ghi màn hình
        mediaRecorder.start();

        // Bắt đầu đếm thời gian
        startTime = Date.now();
        timerInterval = setInterval(() => {
          const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
          const minutes = Math.floor(elapsedTime / 60)
            .toString()
            .padStart(2, "0");
          const seconds = (elapsedTime % 60).toString().padStart(2, "0");
          timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);

        // Xử lý sự kiện khi người dùng nhấn nút dừng
        stopButton.onclick = () => {
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            statusDisplay.textContent = "Đang xử lý...";
            mediaRecorder.stop();
          }
        };

        // Xử lý sự kiện khi người dùng nhấn nút hủy
        cancelButton.onclick = () => {
          // Dừng stream và đóng modal
          cleanup();

          // Trả về kết quả hủy
          resolve({
            success: false,
            message: "Người dùng đã hủy ghi màn hình",
          });
        };
      } catch (error) {
        console.error("Lỗi khi truy cập màn hình:", error);
        // Đóng modal nếu đã tạo
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }

        // Trả về kết quả lỗi
        resolve({
          success: false,
          message: "Không thể truy cập màn hình hoặc người dùng đã hủy yêu cầu",
        });
      }
    });

    // Hàm cleanup để dừng stream và xóa modal
    function cleanup() {
      // Dừng đếm thời gian
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      // Dừng stream nếu có
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Xóa modal
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  } catch (error) {
    console.error("Lỗi khi ghi màn hình:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi ghi màn hình",
    };
  }
}