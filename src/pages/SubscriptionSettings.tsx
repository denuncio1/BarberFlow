import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  Calendar,
  CreditCard,
  Bell,
  Mail,
  MessageSquare,
  Settings2,
  Shield,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Upload,
  Palette,
  Globe,
  Zap,
  FileText,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const SubscriptionSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Estado para as configurações
  const [settings, setSettings] = useState({
    // Acesso via App
    appAccessEnabled: true,
    allowPlanPurchase: true,
    allowPlanUpgrade: true,
    allowAppointmentCreation: true,
    allowAppointmentCancellation: true,
    cancellationHours: 24,

    // Agendamento de Clientes
    clientSchedulingEnabled: true,
    clientPlanManagement: true,
    autoApproveBookings: false,
    requirePaymentConfirmation: true,
    
    // Notificações
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    whatsappNotifications: false,
    
    // Notificações de Email
    notifyNewSubscription: true,
    notifyPlanUpgrade: true,
    notifyPlanCancellation: true,
    notifyPaymentSuccess: true,
    notifyPaymentFailed: true,
    notifyRenewalReminder: true,
    reminderDaysBefore: 3,
    
    // Notificações SMS
    smsNewSubscription: false,
    smsPaymentReminder: true,
    smsPaymentSuccess: false,
    
    // Pagamentos
    autoRenewal: true,
    autoRetryPayment: true,
    maxRetryAttempts: 3,
    retryIntervalDays: 3,
    gracePeriodDays: 7,
    suspendAfterGracePeriod: true,
    
    // Política de Cancelamento
    allowImmediateCancellation: false,
    requireCancellationReason: true,
    cancelAtPeriodEnd: true,
    prorateCancellation: true,
    refundPolicy: "no_refund",
    cancellationNoticeDays: 0,
    
    // Integrações
    stripeEnabled: true,
    paypalEnabled: false,
    mercadoPagoEnabled: false,
    
    // Personalização
    brandColor: "#EAB308",
    logoUrl: "",
    welcomeMessage: "Bem-vindo ao nosso Clube de Assinaturas!",
    termsUrl: "",
    privacyUrl: "",
    
    // Segurança
    requireEmailVerification: true,
    requirePhoneVerification: false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    
    // Relatórios
    weeklyReports: true,
    monthlyReports: true,
    reportEmails: "admin@barberflow.com",
  });

  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testSMSDialog, setTestSMSDialog] = useState(false);

  const handleSaveChanges = () => {
    // Aqui você faria a chamada à API para salvar as configurações
    toast({
      title: "Configurações salvas",
      description: "Todas as alterações foram salvas com sucesso.",
      variant: "default",
    });
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleInputChange = (key: string, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestEmail = () => {
    toast({
      title: "Email de teste enviado",
      description: "Verifique sua caixa de entrada.",
    });
    setTestEmailDialog(false);
  };

  const handleTestSMS = () => {
    toast({
      title: "SMS de teste enviado",
      description: "Você receberá a mensagem em instantes.",
    });
    setTestSMSDialog(false);
  };

  const handleResetDefaults = () => {
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações foram restauradas aos valores padrão.",
      variant: "default",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Configurações da Assinatura
          </h2>
          <p className="text-gray-400 mt-2">
            Gerencie todas as configurações do clube de assinaturas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-yellow-500 text-gray-900 hover:bg-yellow-600"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="app-access" className="space-y-4">
        <TabsList className="bg-gray-800 p-1">
          <TabsTrigger value="app-access" className="data-[state=active]:bg-gray-700">
            <Smartphone className="mr-2 h-4 w-4" />
            Acesso via App
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-700">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-gray-700">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="cancellation" className="data-[state=active]:bg-gray-700">
            <XCircle className="mr-2 h-4 w-4" />
            Cancelamento
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700">
            <Zap className="mr-2 h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="customization" className="data-[state=active]:bg-gray-700">
            <Palette className="mr-2 h-4 w-4" />
            Personalização
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gray-700">
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Tab: Acesso via App */}
        <TabsContent value="app-access" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Clube habilitado no app</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Controle se o clube está ativo e visível no aplicativo móvel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-yellow-500">
                <div className="flex-1">
                  <Label htmlFor="app-enabled" className="text-base font-medium text-white">
                    Habilitar clube no aplicativo
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Quando ativo, os clientes poderão acessar o clube pelo app
                  </p>
                </div>
                <Switch
                  id="app-enabled"
                  checked={settings.appAccessEnabled}
                  onCheckedChange={() => handleToggle("appAccessEnabled")}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>

              {settings.appAccessEnabled && (
                <>
                  <Separator className="bg-gray-700" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-yellow-500" />
                      Permissões dos Clientes
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="allow-purchase" className="text-base font-medium text-white">
                          Permitir aquisição de planos
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Clientes podem comprar novos planos pelo app
                        </p>
                      </div>
                      <Switch
                        id="allow-purchase"
                        checked={settings.allowPlanPurchase}
                        onCheckedChange={() => handleToggle("allowPlanPurchase")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="allow-upgrade" className="text-base font-medium text-white">
                          Permitir upgrade de planos
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Clientes podem fazer upgrade do plano atual
                        </p>
                      </div>
                      <Switch
                        id="allow-upgrade"
                        checked={settings.allowPlanUpgrade}
                        onCheckedChange={() => handleToggle("allowPlanUpgrade")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-yellow-500" />
                      Agendamento de Clientes
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="client-scheduling" className="text-base font-medium text-white">
                          Permitir criação de agendamentos
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Clientes podem criar agendamentos usando créditos do plano
                        </p>
                      </div>
                      <Switch
                        id="client-scheduling"
                        checked={settings.allowAppointmentCreation}
                        onCheckedChange={() => handleToggle("allowAppointmentCreation")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="client-management" className="text-base font-medium text-white">
                          Administração do plano pelo cliente
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Clientes conseguem agendar e fazer administração do plano
                        </p>
                      </div>
                      <Switch
                        id="client-management"
                        checked={settings.clientPlanManagement}
                        onCheckedChange={() => handleToggle("clientPlanManagement")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="allow-cancellation" className="text-base font-medium text-white">
                          Permitir cancelamento de agendamentos
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Clientes podem cancelar seus próprios agendamentos
                        </p>
                      </div>
                      <Switch
                        id="allow-cancellation"
                        checked={settings.allowAppointmentCancellation}
                        onCheckedChange={() => handleToggle("allowAppointmentCancellation")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>

                    {settings.allowAppointmentCancellation && (
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <Label htmlFor="cancellation-hours" className="text-base font-medium text-white">
                          Antecedência mínima para cancelamento
                        </Label>
                        <p className="text-sm text-gray-400 mt-1 mb-3">
                          Número de horas antes do agendamento
                        </p>
                        <div className="flex items-center gap-3">
                          <Input
                            id="cancellation-hours"
                            type="number"
                            value={settings.cancellationHours}
                            onChange={(e) => handleInputChange("cancellationHours", parseInt(e.target.value))}
                            className="bg-gray-800 border-gray-700 text-white w-24"
                            min={0}
                          />
                          <span className="text-gray-400">horas</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="auto-approve" className="text-base font-medium text-white">
                          Aprovar agendamentos automaticamente
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Agendamentos são confirmados sem revisão manual
                        </p>
                      </div>
                      <Switch
                        id="auto-approve"
                        checked={settings.autoApproveBookings}
                        onCheckedChange={() => handleToggle("autoApproveBookings")}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Canais de Notificação */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Canais de Notificação</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Escolha quais canais usar para notificar clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <div>
                      <Label className="text-white">Email</Label>
                      <p className="text-xs text-gray-400">Notificações por email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleToggle("emailNotifications")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    <div>
                      <Label className="text-white">SMS</Label>
                      <p className="text-xs text-gray-400">Notificações por SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={() => handleToggle("smsNotifications")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-purple-400" />
                    <div>
                      <Label className="text-white">Push</Label>
                      <p className="text-xs text-gray-400">Notificações push no app</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={() => handleToggle("pushNotifications")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="text-white">WhatsApp</Label>
                      <p className="text-xs text-gray-400">Notificações via WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      Em breve
                    </Badge>
                    <Switch
                      checked={settings.whatsappNotifications}
                      onCheckedChange={() => handleToggle("whatsappNotifications")}
                      disabled
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-2">
                  <Dialog open={testEmailDialog} onOpenChange={setTestEmailDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-gray-900 text-white hover:bg-gray-700">
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Email de Teste
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Enviar Email de Teste</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Digite o endereço de email para receber um email de teste
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setTestEmailDialog(false)}
                          className="bg-gray-900 text-white hover:bg-gray-700"
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleTestEmail} className="bg-yellow-500 text-gray-900 hover:bg-yellow-600">
                          Enviar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={testSMSDialog} onOpenChange={setTestSMSDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-gray-900 text-white hover:bg-gray-700">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Enviar SMS de Teste
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Enviar SMS de Teste</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Digite o número de telefone para receber um SMS de teste
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        type="tel"
                        placeholder="+55 11 99999-9999"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setTestSMSDialog(false)}
                          className="bg-gray-900 text-white hover:bg-gray-700"
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleTestSMS} className="bg-yellow-500 text-gray-900 hover:bg-yellow-600">
                          Enviar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Eventos de Notificação por Email */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Notificações por Email</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Escolha quais eventos enviam emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Nova assinatura</Label>
                  <Switch
                    checked={settings.notifyNewSubscription}
                    onCheckedChange={() => handleToggle("notifyNewSubscription")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Upgrade de plano</Label>
                  <Switch
                    checked={settings.notifyPlanUpgrade}
                    onCheckedChange={() => handleToggle("notifyPlanUpgrade")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Cancelamento de plano</Label>
                  <Switch
                    checked={settings.notifyPlanCancellation}
                    onCheckedChange={() => handleToggle("notifyPlanCancellation")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Pagamento confirmado</Label>
                  <Switch
                    checked={settings.notifyPaymentSuccess}
                    onCheckedChange={() => handleToggle("notifyPaymentSuccess")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Falha no pagamento</Label>
                  <Switch
                    checked={settings.notifyPaymentFailed}
                    onCheckedChange={() => handleToggle("notifyPaymentFailed")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Lembrete de renovação</Label>
                  <Switch
                    checked={settings.notifyRenewalReminder}
                    onCheckedChange={() => handleToggle("notifyRenewalReminder")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                {settings.notifyRenewalReminder && (
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <Label className="text-white">Enviar lembrete antes da renovação</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Input
                        type="number"
                        value={settings.reminderDaysBefore}
                        onChange={(e) => handleInputChange("reminderDaysBefore", parseInt(e.target.value))}
                        className="bg-gray-800 border-gray-700 text-white w-20"
                        min={1}
                      />
                      <span className="text-gray-400">dias antes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notificações SMS */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Notificações por SMS</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Configure quais eventos enviam SMS (cobrado separadamente)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Nova assinatura</Label>
                  <Switch
                    checked={settings.smsNewSubscription}
                    onCheckedChange={() => handleToggle("smsNewSubscription")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Lembrete de pagamento</Label>
                  <Switch
                    checked={settings.smsPaymentReminder}
                    onCheckedChange={() => handleToggle("smsPaymentReminder")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <Label className="text-white">Pagamento confirmado</Label>
                  <Switch
                    checked={settings.smsPaymentSuccess}
                    onCheckedChange={() => handleToggle("smsPaymentSuccess")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>

              <Alert className="mt-4 bg-blue-500/10 border-blue-500">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-blue-400">Custo de SMS</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Cada SMS enviado tem um custo adicional de R$ 0,25. Os custos são cobrados mensalmente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Renovação Automática</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure como funcionam as renovações de assinaturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-green-500">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Renovação automática</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Cobrar automaticamente na data de renovação
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRenewal}
                    onCheckedChange={() => handleToggle("autoRenewal")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Confirmar pagamento antes</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Requer confirmação manual antes de processar
                    </p>
                  </div>
                  <Switch
                    checked={settings.requirePaymentConfirmation}
                    onCheckedChange={() => handleToggle("requirePaymentConfirmation")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Tentativas de Pagamento</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure como lidar com falhas de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Retentar pagamento automaticamente</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Tentar cobrar novamente quando falhar
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRetryPayment}
                    onCheckedChange={() => handleToggle("autoRetryPayment")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                {settings.autoRetryPayment && (
                  <>
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <Label className="text-white">Número máximo de tentativas</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="number"
                          value={settings.maxRetryAttempts}
                          onChange={(e) => handleInputChange("maxRetryAttempts", parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-700 text-white w-24"
                          min={1}
                          max={10}
                        />
                        <span className="text-gray-400">tentativas</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-900 rounded-lg">
                      <Label className="text-white">Intervalo entre tentativas</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="number"
                          value={settings.retryIntervalDays}
                          onChange={(e) => handleInputChange("retryIntervalDays", parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-700 text-white w-24"
                          min={1}
                        />
                        <span className="text-gray-400">dias</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 bg-gray-900 rounded-lg">
                  <Label className="text-white">Período de carência</Label>
                  <p className="text-sm text-gray-400 mt-1 mb-3">
                    Dias antes de suspender após falha no pagamento
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={settings.gracePeriodDays}
                      onChange={(e) => handleInputChange("gracePeriodDays", parseInt(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white w-24"
                      min={0}
                    />
                    <span className="text-gray-400">dias</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Suspender após período de carência</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Bloquear acesso aos benefícios
                    </p>
                  </div>
                  <Switch
                    checked={settings.suspendAfterGracePeriod}
                    onCheckedChange={() => handleToggle("suspendAfterGracePeriod")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Cancelamento */}
        <TabsContent value="cancellation" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Política de Cancelamento</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Configure como funcionam os cancelamentos de assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Cancelamento imediato</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Permitir cancelamento com efeito imediato
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowImmediateCancellation}
                    onCheckedChange={() => handleToggle("allowImmediateCancellation")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Exigir motivo</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Cliente deve informar o motivo do cancelamento
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireCancellationReason}
                    onCheckedChange={() => handleToggle("requireCancellationReason")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Cancelar no fim do período</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Manter acesso até o fim do período pago
                    </p>
                  </div>
                  <Switch
                    checked={settings.cancelAtPeriodEnd}
                    onCheckedChange={() => handleToggle("cancelAtPeriodEnd")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Reembolso proporcional</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Reembolsar valor proporcional ao tempo não usado
                    </p>
                  </div>
                  <Switch
                    checked={settings.prorateCancellation}
                    onCheckedChange={() => handleToggle("prorateCancellation")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Política de reembolso</Label>
                <Select
                  value={settings.refundPolicy}
                  onValueChange={(value) => handleInputChange("refundPolicy", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="no_refund" className="text-white">
                      Sem reembolso
                    </SelectItem>
                    <SelectItem value="partial_refund" className="text-white">
                      Reembolso parcial (proporcional)
                    </SelectItem>
                    <SelectItem value="full_refund" className="text-white">
                      Reembolso total
                    </SelectItem>
                    <SelectItem value="credit" className="text-white">
                      Crédito para uso futuro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Aviso prévio para cancelamento</Label>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Número de dias de antecedência necessários
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={settings.cancellationNoticeDays}
                    onChange={(e) => handleInputChange("cancellationNoticeDays", parseInt(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white w-24"
                    min={0}
                  />
                  <span className="text-gray-400">dias</span>
                </div>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertTitle className="text-yellow-400">Atenção</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Certifique-se de que suas políticas estão de acordo com as leis de proteção ao consumidor.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integrações */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Gateways de Pagamento</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Configure os métodos de pagamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-purple-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-white">Stripe</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Cartões de crédito e débito internacionais
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Conectado
                  </Badge>
                  <Switch
                    checked={settings.stripeEnabled}
                    onCheckedChange={() => handleToggle("stripeEnabled")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-white">PayPal</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Pagamentos via conta PayPal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Conectar
                  </Button>
                  <Switch
                    checked={settings.paypalEnabled}
                    onCheckedChange={() => handleToggle("paypalEnabled")}
                    disabled
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <CreditCard className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-white">Mercado Pago</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Pagamentos para América Latina
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Conectar
                  </Button>
                  <Switch
                    checked={settings.mercadoPagoEnabled}
                    onCheckedChange={() => handleToggle("mercadoPagoEnabled")}
                    disabled
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Personalização */}
        <TabsContent value="customization" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Aparência e Marca</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Personalize a aparência do clube no aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Cor principal da marca</Label>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Cor usada em botões e destaques
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) => handleInputChange("brandColor", e.target.value)}
                    className="w-20 h-10 bg-gray-800 border-gray-700"
                  />
                  <Input
                    type="text"
                    value={settings.brandColor}
                    onChange={(e) => handleInputChange("brandColor", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Logo do clube</Label>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Imagem exibida no cabeçalho do clube
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button variant="outline" className="bg-gray-800 text-white hover:bg-gray-700">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Mensagem de boas-vindas</Label>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Texto exibido ao cliente entrar no clube
                </p>
                <Textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  placeholder="Digite a mensagem de boas-vindas..."
                />
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-500" />
                  Links Legais
                </h3>

                <div className="p-4 bg-gray-900 rounded-lg">
                  <Label className="text-white">URL dos Termos de Uso</Label>
                  <Input
                    type="url"
                    value={settings.termsUrl}
                    onChange={(e) => handleInputChange("termsUrl", e.target.value)}
                    placeholder="https://exemplo.com/termos"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>

                <div className="p-4 bg-gray-900 rounded-lg">
                  <Label className="text-white">URL da Política de Privacidade</Label>
                  <Input
                    type="url"
                    value={settings.privacyUrl}
                    onChange={(e) => handleInputChange("privacyUrl", e.target.value)}
                    placeholder="https://exemplo.com/privacidade"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Verificação de Identidade</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure requisitos de verificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Verificar email</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Clientes devem verificar o email antes de assinar
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={() => handleToggle("requireEmailVerification")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Verificar telefone</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Clientes devem verificar o telefone via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.requirePhoneVerification}
                    onCheckedChange={() => handleToggle("requirePhoneVerification")}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium text-white">Autenticação de dois fatores</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Requer código adicional para acesso
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      Em breve
                    </Badge>
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={() => handleToggle("twoFactorEnabled")}
                      disabled
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white">Sessão e Acesso</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure políticas de sessão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <Label className="text-white">Tempo limite de sessão</Label>
                  <p className="text-sm text-gray-400 mt-1 mb-3">
                    Minutos de inatividade antes de desconectar
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white w-24"
                      min={5}
                    />
                    <span className="text-gray-400">minutos</span>
                  </div>
                </div>

                <Alert className="bg-green-500/10 border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertTitle className="text-green-400">SSL Habilitado</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Todas as conexões são criptografadas com SSL/TLS.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-blue-500/10 border-blue-500">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertTitle className="text-blue-400">Conformidade LGPD</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Sistema em conformidade com a Lei Geral de Proteção de Dados.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-white">Relatórios Administrativos</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Configure envio de relatórios por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium text-white">Relatórios semanais</Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Resumo semanal de assinaturas e receita
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={() => handleToggle("weeklyReports")}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium text-white">Relatórios mensais</Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Relatório completo mensal com análises
                  </p>
                </div>
                <Switch
                  checked={settings.monthlyReports}
                  onCheckedChange={() => handleToggle("monthlyReports")}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg">
                <Label className="text-white">Emails para receber relatórios</Label>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Separe múltiplos emails com vírgula
                </p>
                <Input
                  type="text"
                  value={settings.reportEmails}
                  onChange={(e) => handleInputChange("reportEmails", e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionSettings;
