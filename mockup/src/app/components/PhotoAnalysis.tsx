import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X, Droplet, Circle, Zap, LineChart } from 'lucide-react@0.263.1';
import beforeImage from 'figma:asset/0532c7858ca4882ba8d178f8c337327e5833dec9.png';
import afterImage from 'figma:asset/815533458292cd303d185db936c41c5de9e0f784.png';

interface PhotoAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoAnalysis({ open, onOpenChange }: PhotoAnalysisProps) {
  const analysisIndicators = [
    {
      icon: Droplet,
      label: 'Oleosidade',
      value: 'Moderada',
      color: '#C7A534'
    },
    {
      icon: Circle,
      label: 'Manchas',
      value: 'Leves',
      color: '#C7A534'
    },
    {
      icon: Zap,
      label: 'Acne',
      value: 'Baixa',
      color: '#C7A534'
    },
    {
      icon: LineChart,
      label: 'Rugas',
      value: 'Mínimas',
      color: '#C7A534'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] max-h-[900px] p-0 gap-0 bg-[#F5EFE7] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-3 border-b border-[#D9D9D9]/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-[#1E1E1E]">
              Análise Fotográfica
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-[#1E1E1E] hover:bg-[#E7BFBF]/30 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-xs text-[#757575] mt-0.5">
            Comparação visual e análise detalhada da sua pele
          </DialogDescription>
        </DialogHeader>

        {/* Main Content - Scrollable */}
        <div className="flex-1 px-6 py-3 flex flex-col min-h-0">
          {/* Before/After Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-3 flex-shrink-0">
            {/* Before Photo */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-[#D9D9D9]/20">
              <div className="relative aspect-[4/5] bg-[#F5EFE7]">
                <img
                  src={beforeImage}
                  alt="Antes - Análise"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#591C21] text-[#F5EFE7] px-3 py-1 rounded-full shadow-lg">
                  <p className="text-xs">Antes</p>
                </div>
              </div>
              <div className="px-3 py-1.5 border-t border-[#D9D9D9]/20">
                <p className="text-xs text-[#757575] text-center">
                  Foto original enviada
                </p>
              </div>
            </div>

            {/* After Photo - Simulation */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md border-2 border-[#E7BFBF]">
              <div className="relative aspect-[4/5] bg-[#F5EFE7]">
                <img
                  src={afterImage}
                  alt="Depois - Simulação"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#E7BFBF] text-[#591C21] px-3 py-1 rounded-full shadow-lg">
                  <p className="text-xs">Depois – Simulação</p>
                </div>
                <div className="absolute top-2 right-2 bg-[#C7A534] text-[#F5EFE7] p-1 rounded-full shadow-lg">
                  <Zap className="h-3 w-3" />
                </div>
              </div>
              <div className="px-3 py-1.5 border-t border-[#E7BFBF]/50">
                <p className="text-xs text-[#757575] text-center">
                  Resultados estimados com produtos recomendados
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Indicators */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-[#D9D9D9]/20 mb-3 flex-shrink-0">
            <h3 className="text-sm text-[#1E1E1E] mb-2 text-center">
              Indicadores Analisados
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {analysisIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-[#F5EFE7] hover:bg-[#E7BFBF]/20 transition-colors"
                >
                  <div className="bg-[#C7A534] rounded-full p-1.5 shadow-sm">
                    <indicator.icon className="h-3.5 w-3.5 text-[#F5EFE7]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#1E1E1E]">
                      {indicator.label}
                    </p>
                    <p className="text-[10px] text-[#757575]">
                      {indicator.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0 mb-3">
            <Button
              size="lg"
              className="bg-[#591C21] hover:bg-[#591C21]/90 text-[#F5EFE7] rounded-xl shadow-md h-11"
              onClick={() => {
                console.log('Upload new photo');
              }}
            >
              Carregar nova foto
            </Button>
            <Button
              size="lg"
              className="bg-[#E7BFBF] hover:bg-[#E7BFBF]/90 text-[#591C21] rounded-xl shadow-md h-11"
              onClick={() => {
                onOpenChange(false);
                console.log('Show recommendations');
              }}
            >
              Ver recomendações
            </Button>
          </div>

          {/* Additional Info */}
          <div className="p-3 bg-white rounded-xl border border-[#C7A534]/30 flex-shrink-0">
            <div className="flex items-start gap-2">
              <div className="bg-[#C7A534]/10 rounded-full p-1.5 flex-shrink-0">
                <Zap className="h-3.5 w-3.5 text-[#C7A534]" />
              </div>
              <div>
                <p className="text-xs text-[#1E1E1E] mb-0.5">
                  Análise concluída com sucesso
                </p>
                <p className="text-[10px] text-[#757575]">
                  Os produtos recomendados foram selecionados especialmente para o seu tipo de pele e necessidades identificadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}