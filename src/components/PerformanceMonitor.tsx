import {
    ClockCircleOutlined,
    DatabaseOutlined,
    DesktopOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  loadTime: number;
  renderTime: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: { used: 0, total: 0, percentage: 0 },
    loadTime: 0,
    renderTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const total = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const percentage = Math.round((used / total) * 100);
        
        setMetrics(prev => ({
          ...prev,
          memory: { used, total, percentage }
        }));
      }
    };

    const measureLoadTime = () => {
      const loadTime = performance.now();
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    // Start measurements
    measureFPS();
    measureMemory();
    measureLoadTime();

    // Update memory usage every 2 seconds
    const memoryInterval = setInterval(measureMemory, 2000);

    // Toggle visibility with Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card 
        title="Performance Monitor" 
        size="small"
        className="w-80 bg-black/80 text-white border-white/20"
        bodyStyle={{ padding: '12px' }}
      >
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Statistic
              title="FPS"
              value={metrics.fps}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: metrics.fps > 30 ? '#52c41a' : metrics.fps > 15 ? '#faad14' : '#ff4d4f' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Memory (MB)"
              value={metrics.memory.used}
              prefix={<DatabaseOutlined />}
              suffix={`/ ${metrics.memory.total}`}
              valueStyle={{ color: metrics.memory.percentage < 70 ? '#52c41a' : metrics.memory.percentage < 90 ? '#faad14' : '#ff4d4f' }}
            />
          </Col>
        </Row>
        
        <div className="mt-2">
          <div className="text-xs text-gray-300 mb-1">Memory Usage</div>
          <Progress 
            percent={metrics.memory.percentage} 
            size="small"
            strokeColor={metrics.memory.percentage < 70 ? '#52c41a' : metrics.memory.percentage < 90 ? '#faad14' : '#ff4d4f'}
            showInfo={false}
          />
        </div>

        <Row gutter={[8, 8]} className="mt-2">
          <Col span={12}>
            <Statistic
              title="Load Time"
              value={Math.round(metrics.loadTime)}
              prefix={<ClockCircleOutlined />}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Render Time"
              value={Math.round(metrics.renderTime)}
              prefix={<DesktopOutlined />}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <div className="mt-2 text-xs text-gray-400">
          Press Ctrl+Shift+P to toggle
        </div>
      </Card>
    </div>
  );
};

export default PerformanceMonitor; 