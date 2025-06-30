import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';

const features = [
  {
    title: 'Upload & Manage PDFs',
    desc: 'Easily upload, preview, and organize your documents in one place.',
    icon: '📄',
  },
  {
    title: 'Sign & Share Securely',
    desc: 'Drag-and-drop signatures, share with anyone, and track status.',
    icon: '✍️',
  },
  {
    title: 'Audit & Compliance',
    desc: 'Full audit logs for every action, signer, and document.',
    icon: '🔒',
  },
];

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Sign Documents with Ease
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Upload, sign, and share documents securely. Get your documents signed faster with SignIt.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-base text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 