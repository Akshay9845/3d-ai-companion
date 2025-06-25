import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, List, Spin, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { APITestResult, APITestService } from '../lib/apiTest';

const APITestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<APITestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setEnvStatus(APITestService.getEnvironmentStatus());
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await APITestService.testAllAPIs();
      setTestResults(results);
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'not_configured':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'success';
      case 'error':
        return 'error';
      case 'not_configured':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      <Card 
        title="🔧 API Status Check" 
        size="small"
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={runTests}
            loading={isLoading}
            size="small"
          >
            Test APIs
          </Button>
        }
      >
        {/* Environment Variables Status */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Environment Variables:</h4>
          <div className="space-y-1">
            {Object.entries(envStatus).map(([key, configured]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="truncate">{key}</span>
                <Tag color={configured ? 'success' : 'error'} size="small">
                  {configured ? '✓' : '✗'}
                </Tag>
              </div>
            ))}
          </div>
        </div>

        {/* API Test Results */}
        {testResults.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">API Test Results:</h4>
            <List
              size="small"
              dataSource={testResults}
              renderItem={(result) => (
                <List.Item className="px-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{result.service}</span>
                      <Tag color={getStatusColor(result.status)} size="small">
                        {getStatusIcon(result.status)}
                        <span className="ml-1">{result.status}</span>
                      </Tag>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-500">
                        Details: {JSON.stringify(result.details)}
                      </p>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <Spin size="small" />
            <p className="text-xs text-gray-500 mt-2">Testing APIs...</p>
          </div>
        )}

        {testResults.length === 0 && !isLoading && (
          <Alert
            message="No tests run yet"
            description="Click 'Test APIs' to check the status of all configured APIs."
            type="info"
            showIcon
            size="small"
          />
        )}
      </Card>
    </div>
  );
};

export default APITestPanel; 