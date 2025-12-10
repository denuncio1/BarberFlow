import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, CheckCircle, Clock, Smartphone, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";

export const SelfServiceKiosk: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [checkins, setCheckins] = useState<any[]>([]);

  // Mock slots
  const slots = [
    "10:00 - João Barber",
    "10:30 - Maria Barber",
    "11:00 - Carlos Barber",
    "11:30 - Livre",
  ];

  useEffect(() => {
    const fetchCheckins = async () => {
      const { data } = await supabase
        .from("self_service_checkins")
        .select("*")
        .order("created_at", { ascending: true });
      setCheckins(data || []);
    };
    fetchCheckins();
    const interval = setInterval(fetchCheckins, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    if (!name || !phone || !selectedSlot) return;
    await supabase.from("self_service_checkins").insert([
      {
        name,
        phone,
        slot: selectedSlot,
        payment_done: paymentDone,
        created_at: new Date().toISOString(),
      },
    ]);
    await sendNotification({ name, phone, slot: selectedSlot });
    setStep(4);
  };

  return (
    <Card className="max-w-md mx-auto mt-8 p-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-500" /> Autoatendimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Fila/status em tempo real */}
        <div className="mb-6">
          <div className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Fila de atendimentos
          </div>
          <ul className="space-y-1">
            {checkins.length === 0 && <li className="text-xs text-gray-400">Nenhum atendimento na fila.</li>}
            {checkins.map((c, idx) => (
              <li key={c.id || idx} className="flex items-center justify-between text-xs p-2 rounded bg-gray-100 dark:bg-gray-800">
                <span>{c.name} ({c.phone})</span>
                <span className="font-mono text-blue-600">{c.slot}</span>
                <span className={c.payment_done ? "text-green-600" : "text-yellow-600"}>{c.payment_done ? "Pago" : "A pagar"}</span>
              </li>
            ))}
          </ul>
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="font-semibold text-sm">Informe seu nome e telefone:</div>
            <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button className="w-full mt-2" disabled={!name || !phone} onClick={() => setStep(2)}>
              Avançar
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="font-semibold text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-green-500" /> Escolha o horário:
            </div>
            <ul className="space-y-2">
              {slots.map(slot => (
                <li key={slot}>
                  <Button
                    variant={selectedSlot === slot ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="w-full mt-2" disabled={!selectedSlot} onClick={() => setStep(3)}>
              Confirmar horário
            </Button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="font-semibold text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" /> Pagamento digital:
            </div>
            <Button className="w-full" onClick={async () => { setPaymentDone(true); await handleCheckIn(); }}>
              Pagar agora
            </Button>
            <Button variant="outline" className="w-full" onClick={async () => { setPaymentDone(false); await handleCheckIn(); }}>
              Pagar na barbearia
            </Button>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <div className="font-bold text-lg">Check-in realizado!</div>
            <div className="text-sm">Seu atendimento está confirmado.<br />Você receberá notificações automáticas sobre o status e tempo de espera.</div>
            <Button className="w-full mt-4" onClick={() => { setStep(1); setName(""); setPhone(""); setSelectedSlot(null); setPaymentDone(false); }}>
              Novo atendimento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
