# Como Adicionar Sua Logo

## Opção 1: Usar uma Imagem (Recomendado)

1. Adicione sua logo nesta pasta `public/` com o nome `logo.png` ou `logo.svg`
2. No arquivo `src/App.jsx`, localize o componente `Logo` (linha ~111)
3. Substitua o SVG por:

```jsx
const Logo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16'
    };
    
    return (
        <img 
            src="/logo.png" 
            alt="Logo" 
            className={`${sizes[size]} ${className}`} 
        />
    );
};
```

## Opção 2: Personalizar o SVG Atual

O SVG atual mostra:
- Um ícone de checklist azul
- Texto "Rotinas" e "TI Manager"

Você pode editar as cores, texto e ícone diretamente no componente `Logo` em `src/App.jsx`.

## Tamanhos da Logo

A logo aparece em 3 tamanhos:
- **lg (h-16)**: Tela de login
- **md (h-12)**: Sidebar desktop
- **sm (h-8)**: Pode ser usado em outros lugares

## Formatos Recomendados

- **PNG**: Fundo transparente, 400x120px
- **SVG**: Vetorial, escalável
- **JPG**: Apenas se tiver fundo branco
