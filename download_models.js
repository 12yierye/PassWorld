const fs = require('fs');
const https = require('https');
const path = require('path');

// 模型文件列表
const modelFiles = [
  // Tiny Face Detector
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard2',
  
  // Face Landmark 68
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
  
  // Face Recognition
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard3',
  
  // Face Expression
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1'
];

// 确保models目录存在
const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// 下载单个文件
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`已下载: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // 删除不完整的文件
      reject(err);
    });
  });
}

// 下载所有模型文件
async function downloadAllModels() {
  console.log('开始下载人脸识别模型文件...');
  
  try {
    for (const url of modelFiles) {
      const fileName = path.basename(url);
      const dest = path.join(modelsDir, fileName);
      
      if (!fs.existsSync(dest)) {
        await downloadFile(url, dest);
      } else {
        console.log(`文件已存在，跳过: ${fileName}`);
      }
    }
    
    console.log('所有模型文件下载完成！');
    console.log(`模型文件已保存到: ${modelsDir}`);
  } catch (error) {
    console.error('下载过程中出现错误:', error);
  }
}

// 执行下载
downloadAllModels();