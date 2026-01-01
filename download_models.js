import { promises as fsPromises, createWriteStream } from 'fs';
import { get } from 'https';
import { join } from 'path';

// 模型文件列表 - 使用国内镜像源
const modelFiles = [
  // Tiny Face Detector
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/tiny_face_detector_model-weights_manifest.json',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/tiny_face_detector_model-shard1',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/tiny_face_detector_model-shard2',
  
  // Face Landmark 68
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_landmark_68_model-weights_manifest.json',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_landmark_68_model-shard1',
  
  // Face Recognition
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_recognition_model-weights_manifest.json',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_recognition_model-shard1',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_recognition_model-shard2',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_recognition_model-shard3',
  
  // Face Expression
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_expression_model-weights_manifest.json',
  'https://registry.npmmirror.com/face-api.js/0.22.2/files/weights/face_expression_model-shard1'
];

// 确保models目录存在
const modelsDir = join('public', 'models');
try {
  await fsPromises.mkdir(modelsDir, { recursive: true });
} catch (e) {
  // 如果目录已存在，可能会抛出错误，这没关系
}

// 下载单个文件
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    
    get(url, (response) => {
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
      fsPromises.unlink(dest).catch(() => {}); // 删除不完整的文件
      reject(err);
    });
  });
}

// 下载所有模型文件
async function downloadAllModels() {
  console.log('开始下载人脸识别模型文件...');
  
  try {
    for (const url of modelFiles) {
      const fileName = url.split('/').pop();
      const dest = join(modelsDir, fileName);
      
      // 检查文件是否已存在
      try {
        await fsPromises.access(dest);
        console.log(`文件已存在，跳过: ${fileName}`);
      } catch {
        // 文件不存在，需要下载
        await downloadFile(url, dest);
      }
    }
    
    console.log('所有模型文件下载完成！');
    console.log(`模型文件已保存到: ${modelsDir}`);
  } catch (error) {
    console.error('下载过程中出现错误:', error);
    
    // 如果使用镜像源失败，提示用户手动下载
    console.log('\n如果镜像源下载失败，请尝试以下方法：');
    console.log('1. 检查网络连接');
    console.log('2. 尝试使用VPN访问国外资源');
    console.log('3. 手动访问以下链接下载模型文件：');
    console.log('   https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
    console.log('4. 将下载的模型文件放在 public/models 目录下');
  }
}

// 执行下载
downloadAllModels();