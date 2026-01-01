import * as faceapi from 'face-api.js';

// 人脸管理工具类
class FaceManager {
  constructor() {
    this.isModelLoaded = false;
    this.MODEL_URL = '/models';
  }

  // 加载人脸识别模型
  async loadModels() {
    if (this.isModelLoaded) {
      return;
    }

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(this.MODEL_URL);
      this.isModelLoaded = true;
      console.log('人脸识别模型加载成功');
      return true;
    } catch (error) {
      console.error('模型加载失败:', error);
      return false;
    }
  }

  // 检测人脸并提取特征
  async detectFace(videoEl) {
    try {
      const detections = await faceapi.detectSingleFace(
        videoEl,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

      return detections;
    } catch (error) {
      console.error('人脸检测失败:', error);
      return null;
    }
  }

  // 识别人脸
  async recognizeFace(videoEl, accounts) {
    const detection = await this.detectFace(videoEl);
    
    if (!detection) {
      return { success: false, message: '未检测到面部' };
    }

    const faceDescriptor = detection.descriptor;
    
    // 检查是否与已注册的面部匹配
    for (const account of accounts) {
      if (account.faceDescriptors && account.faceDescriptors.length > 0) {
        // 创建面部匹配器
        const labeledDescriptors = [
          new faceapi.LabeledFaceDescriptors(account.username, account.faceDescriptors)
        ];
        
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
        const bestMatch = faceMatcher.findBestMatch(faceDescriptor);
        
        // 如果匹配度足够高（距离小于0.6）
        if (bestMatch.label === account.username && bestMatch.distance < 0.6) {
          return { 
            success: true, 
            username: account.username,
            distance: bestMatch.distance
          };
        }
      }
    }
    
    return { success: false, message: '面部不匹配' };
  }

  // 注册新人脸
  async registerFace(videoEl) {
    const detection = await this.detectFace(videoEl);
    
    if (!detection) {
      return { success: false, message: '未检测到面部' };
    }

    return { 
      success: true, 
      descriptor: detection.descriptor 
    };
  }

  // 检查用户是否已注册
  async isFaceRegistered(faceDescriptor, accounts, username) {
    // 检查是否与当前用户名的已存面部匹配
    const userAccount = accounts.find(acc => acc.username === username);
    
    if (!userAccount || !userAccount.faceDescriptors) {
      return false;
    }

    // 创建面部匹配器
    const labeledDescriptors = [
      new faceapi.LabeledFaceDescriptors(username, userAccount.faceDescriptors)
    ];
    
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
    const bestMatch = faceMatcher.findBestMatch(faceDescriptor);
    
    return bestMatch.distance < 0.6;
  }

  // 检查同一张脸是否注册了超过2个账户
  async isFaceOverLimit(faceDescriptor, accounts, excludeUsername = null) {
    let matchCount = 0;
    
    for (const account of accounts) {
      if (excludeUsername && account.username === excludeUsername) {
        continue;
      }
      
      if (account.faceDescriptors && account.faceDescriptors.length > 0) {
        const labeledDescriptors = [
          new faceapi.LabeledFaceDescriptors(account.username, account.faceDescriptors)
        ];
        
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
        const bestMatch = faceMatcher.findBestMatch(faceDescriptor);
        
        if (bestMatch.distance < 0.6) {
          matchCount++;
        }
      }
    }
    
    return matchCount >= 2;
  }
}

export default new FaceManager();