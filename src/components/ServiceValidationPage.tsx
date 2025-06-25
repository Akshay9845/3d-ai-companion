import React, { useState } from 'react';
import { serviceValidator } from '../tests/serviceValidation';

interface TestResult {
  service: string;
  success: boolean;
  response?: string;
  error?: string;
  responseTime?: number;
}

interface ValidationSummary {
  totalPassed: number;
  totalFailed: number;
  readyForDeployment: boolean;
  recommendations: string[];
}

const ServiceValidationPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    groq?: TestResult;
    gemini?: TestResult;
    summary?: ValidationSummary;
    chatFlow?: { success: boolean; error?: string; message?: string };
  }>({});

  const runValidation = async () => {
    setTesting(true);
    setResults({});

    try {
      console.log('Starting service validation...');
      
      // Test individual services
      const validation = await serviceValidator.validateAllServices();
      
      // Test chat integration flow
      const chatFlowTest = await serviceValidator.testChatIntegrationFlow();
      
      setResults({
        groq: validation.groq,
        gemini: validation.gemini,
        summary: validation.summary,
        chatFlow: chatFlowTest
      });

    } catch (error) {
      console.error('Validation failed:', error);
      setResults({
        summary: {
          totalPassed: 0,
          totalFailed: 2,
          readyForDeployment: false,
          recommendations: [`Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      });
    } finally {
      setTesting(false);
    }
  };

  const ResultCard: React.FC<{ result: TestResult; title: string }> = ({ result, title }) => (
    <div className={`p-4 rounded-lg border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.success ? '✅' : '❌'}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
        {result.responseTime && (
          <span className="text-sm text-gray-500">({result.responseTime}ms)</span>
        )}
      </div>
      
      {result.success && result.response && (
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-700">Response:</p>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border max-h-20 overflow-y-auto">
            {result.response}
          </p>
        </div>
      )}
      
      {!result.success && result.error && (
        <div className="mb-2">
          <p className="text-sm font-medium text-red-700">Error:</p>
          <p className="text-sm text-red-600 bg-red-100 p-2 rounded border">
            {result.error}
          </p>
        </div>
      )}
    </div>
  );

  const SummaryCard: React.FC<{ summary: ValidationSummary }> = ({ summary }) => (
    <div className={`p-6 rounded-lg border-2 ${summary.readyForDeployment ? 'border-blue-500 bg-blue-50' : 'border-yellow-500 bg-yellow-50'}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className={summary.readyForDeployment ? 'text-blue-600' : 'text-yellow-600'}>
          {summary.readyForDeployment ? '🎉' : '⚠️'}
        </span>
        Validation Summary
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.totalPassed}</div>
          <div className="text-sm text-gray-600">Services Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.totalFailed}</div>
          <div className="text-sm text-gray-600">Services Failed</div>
        </div>
      </div>

      <div className={`p-3 rounded font-medium text-center ${summary.readyForDeployment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {summary.readyForDeployment ? 'READY FOR DEPLOYMENT' : 'NOT READY FOR DEPLOYMENT'}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
        <ul className="space-y-1">
          {summary.recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-1">
              <span className="mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const ChatFlowCard: React.FC<{ result: { success: boolean; error?: string; message?: string } }> = ({ result }) => (
    <div className={`p-4 rounded-lg border-2 ${result.success ? 'border-purple-500 bg-purple-50' : 'border-orange-500 bg-orange-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl ${result.success ? 'text-purple-600' : 'text-orange-600'}`}>
          {result.success ? '🔄' : '⚠️'}
        </span>
        <h3 className="text-lg font-semibold">Chat Integration Flow</h3>
      </div>
      
      {result.success && result.message && (
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-700">Test Response:</p>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
            {result.message}
          </p>
        </div>
      )}
      
      {!result.success && result.error && (
        <div className="mb-2">
          <p className="text-sm font-medium text-orange-700">Issue:</p>
          <p className="text-sm text-orange-600 bg-orange-100 p-2 rounded border">
            {result.error}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Validation Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Test Groq and Gemini services before deployment to ensure proper functionality.
          </p>
          
          <button
            onClick={runValidation}
            disabled={testing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              testing
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testing ? 'Testing Services...' : 'Run Validation Tests'}
          </button>
        </div>

        {testing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Running validation tests...</span>
            </div>
          </div>
        )}

        {results.summary && (
          <div className="space-y-6">
            <SummaryCard summary={results.summary} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.groq && <ResultCard result={results.groq} title="Groq Service" />}
              {results.gemini && <ResultCard result={results.gemini} title="Gemini Service" />}
            </div>

            {results.chatFlow && (
              <ChatFlowCard result={results.chatFlow} />
            )}
            
            {results.summary.readyForDeployment && (
              <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">🚀</span>
                  <div>
                    <p className="font-medium text-green-800">Ready for Deployment!</p>
                    <p className="text-sm text-green-700">
                      All critical services are working correctly. You can proceed with deployment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceValidationPage;
