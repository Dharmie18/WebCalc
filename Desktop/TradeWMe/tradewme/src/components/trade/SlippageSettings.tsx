'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SlippageSettingsProps {
  value: number;
  onChange: (value: number) => void;
}

const presetValues = [0.1, 0.5, 1.0];

export function SlippageSettings({ value, onChange }: SlippageSettingsProps) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <Label>Slippage Tolerance</Label>
      <div className="flex gap-2">
        {presetValues.map((preset) => (
          <Button
            key={preset}
            variant={value === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset)}
          >
            {preset}%
          </Button>
        ))}
        <div className="flex-1 flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="h-9"
            step="0.1"
            min="0"
            max="50"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      {value > 5 && (
        <p className="text-xs text-yellow-600">
          High slippage tolerance may result in unfavorable rates
        </p>
      )}
    </div>
  );
}
