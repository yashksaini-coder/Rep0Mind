import { GitHubChat } from "./components/ChatInterface";
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
          Rep0Mind 
          </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <GitHubChat />
        </div>
      </div>
    </main>
  );
}