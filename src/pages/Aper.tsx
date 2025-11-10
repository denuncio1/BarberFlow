import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Aper = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Módulo A.P.E.R.</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Inteligência Artificial para personalização de serviço (Estilo) e otimização de receita (Reputação).
        </p>

        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. IA Preditiva de Estilo (Otimização da Venda)</h2>
          <p className="text-md text-gray-600 dark:text-gray-400 mb-6">
            Este recurso usa o histórico do cliente e dados externos (tendências) para sugerir proativamente serviços e produtos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Próximo Corte Sugerido</CardTitle>
                <CardDescription>Baseado no histórico e tendências.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-2">Sugestão para João Silva:</p>
                <p className="text-xl text-primary font-bold mb-4">"Low Fade, mais curto na lateral"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Último corte: 15/07/2024. Tendência detectada no Instagram.
                </p>
                <Button className="mt-4 w-full">Agendar este corte</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendação de Sazonalidade/Tendência</CardTitle>
                <CardDescription>Sugestões de serviços e produtos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-2">Para Maria Souza:</p>
                <p className="text-xl text-primary font-bold mb-4">"Ajuste de Transição para Stubble Beard"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tendência de "Stubble Beard" forte na rede social.
                </p>
                <Button className="mt-4 w-full">Ver detalhes do serviço</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso de IA para Match de Produtos</CardTitle>
              <CardDescription>Sugestão de produtos de home care ao fechar a comanda.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium mb-2">Ao fechar comanda de Pedro Alves (cabelo oleoso, barba cheia):</p>
              <ul className="list-disc list-inside text-primary-foreground/80 mb-4">
                <li>Pomada de Fixação Forte X</li>
                <li>Shampoo para Couro Oleoso Y</li>
                <li>Óleo para Barba Hidratante Z</li>
              </ul>
              <Button className="w-full">Adicionar ao carrinho</Button>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-10" />

        <p className="text-center text-gray-500 dark:text-gray-400">
          *Funcionalidades de IA simuladas para demonstração. Requerem integração de backend real.
        </p>
      </div>
    </div>
  );
};

export default Aper;