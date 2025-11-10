import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header"; // Import the new Header component

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header /> {/* Include the Header component */}
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center p-4">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">Bem-vindo ao BarberFlow</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Sua barbearia moderna e eficiente.
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500 mt-2">
            Aguardando os detalhes do seu plano para continuar!
          </p>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;