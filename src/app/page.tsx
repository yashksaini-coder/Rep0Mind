import { Weather } from "./components/Weather";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
          Weather App
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Weather />
        </div>
      </div>
    </main>
  );
}