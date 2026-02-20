export interface MenuItem {
    id: string;
    name: string;
    description: string;
    priceInCents: number;
    imageUrl: string;
    category: "burgers" | "sides" | "drinks";
}

export const MENU_ITEMS: MenuItem[] = [
    // Bugers
    {
        id: "6e2bb113-2d64-4e42-9f33-6cfc6cfb2e59",
        name: "Izotop Wołowiny",
        description: "Klasyczny smash 100% wołowiny, topiony cheddar, piklowana cebula, sos 'Reakcja 01'. Bułka 100% bezglutenowa.",
        priceInCents: 3500, // 35.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
        category: "burgers",
    },
    {
        id: "a3e91b65-9856-4c4c-9fcf-b6bfa1af67e1",
        name: "Reakcja Maillarda",
        description: "Podwójny burger, chrupiący bekon, ser wędzony, sos BBQ z wędzonym dymem, bezglutenowa bułka.",
        priceInCents: 4500, // 45.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&q=80&w=800",
        category: "burgers",
    },
    {
        id: "72d9fc66-0d19-4820-9bf7-22f3e098ed51",
        name: "Synteza Sera",
        description: "Trójfazowa kompozycja serów: gouda, cheddar i lazur, z dodatkiem karmelizowanej czerwonej cebuli. Bez glutenu.",
        priceInCents: 4200, // 42.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800",
        category: "burgers",
    },

    // Sides
    {
        id: "f8b9e6ad-2253-41bb-96f1-3ecda0fbe9e3",
        name: "Złoty Katalizator",
        description: "Grubo ciachane frytki smażone w głębokim oleju, posypane solą morską i rozmarynem.",
        priceInCents: 1500, // 15.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800",
        category: "sides",
    },

    // Drinks
    {
        id: "a52c1fe4-40fe-4c6f-998f-2f88e6e58f00",
        name: "H2O z Bąbelkami",
        description: "Orzeźwiająca woda gazowana prosto z laboratorium schłodzona do 4°C.",
        priceInCents: 800, // 8.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?auto=format&fit=crop&q=80&w=800",
        category: "drinks",
    },
    {
        id: "b452e6f1-a3f2-4e92-a162-81c81ef9cf98",
        name: "Eliksir Kofeinowy",
        description: "Mocno gazowany eliksir kolowy, idealny do zneutralizowania resztek kapsaicyny.",
        priceInCents: 1000, // 10.00 PLN
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800",
        category: "drinks",
    }
];
