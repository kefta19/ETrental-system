import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface Workflow {
  role: string;
  audience: string;
  icon: string;
  summary: string;
  stages: { title: string; description: string; icon: string; visualLabel: string }[];
  finish: string;
  linkLabel?: string;
  link?: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private revealObserver?: IntersectionObserver;
  private ticking = false;
  private reducedMotion = false;

  readonly workflows: Workflow[] = [
    {
      role: 'Renter',
      audience: 'From account creation to your next home',
      icon: 'search',
      summary:
        'Create a renter account, find a home that fits, and follow your inquiry or application from your dashboard.',
      stages: [
        {
          title: 'Create your renter account',
          description:
            'Choose Renter, enter your name, email, phone number, and password, or continue with Google.',
          icon: 'person_add_alt_1',
          visualLabel: 'Your renter profile',
        },
        {
          title: 'Search for a rental',
          description:
            'Browse listings and filter by location, rent, property type, rooms, and amenities.',
          icon: 'travel_explore',
          visualLabel: 'Find the right location',
        },
        {
          title: 'Save homes and searches',
          description: 'Keep favorite properties and save searches to return to them later.',
          icon: 'favorite_border',
          visualLabel: 'Keep your shortlist',
        },
        {
          title: 'Contact the landlord',
          description: 'Open a listing to send an inquiry, request a viewing, or apply to rent.',
          icon: 'forum',
          visualLabel: 'Start a conversation',
        },
        {
          title: 'Follow your rental request',
          description:
            'Track messages, viewing appointments, and application updates in your renter dashboard.',
          icon: 'event_available',
          visualLabel: 'Track your next steps',
        },
      ],
      finish:
        'The landlord responds to your inquiry or application. Coordinate the next steps directly and keep the outcome up to date in ETrental.',
      linkLabel: 'Create a renter account',
      link: '/register',
    },
    {
      role: 'Landlord',
      audience: 'From registration to a completed tenancy',
      icon: 'real_estate_agent',
      summary:
        'Register as a landlord, submit a property for review, then manage renter activity through the tenancy.',
      stages: [
        {
          title: 'Create your landlord account',
          description:
            'Choose Landlord, enter your name, email, phone number, and password, or continue with Google.',
          icon: 'person_add_alt_1',
          visualLabel: 'Set up your profile',
        },
        {
          title: 'Prepare your listing',
          description:
            'Add the property description, location, rent and terms, amenities, and photos.',
          icon: 'home_work',
          visualLabel: 'Build your property listing',
        },
        {
          title: 'Confirm contact and submit',
          description:
            'Check your contact details, select a payment method, enter the listing-fee transaction reference and receipt link, then submit for review.',
          icon: 'receipt_long',
          visualLabel: 'Submit payment details',
        },
        {
          title: 'Wait for admin review',
          description:
            'Your listing remains private while the payment and property details are reviewed. Approval publishes it; submission alone does not.',
          icon: 'fact_check',
          visualLabel: 'Listing review',
        },
        {
          title: 'Work with prospective renters',
          description:
            'Respond to inquiries, coordinate viewing requests, and review rental applications from your landlord workspace.',
          icon: 'forum',
          visualLabel: 'Meet interested renters',
        },
        {
          title: 'Finalize the rental',
          description:
            'Record the agreed tenancy details and mark the property as rented when the tenancy is finalized.',
          icon: 'key',
          visualLabel: 'Complete the rental',
        },
      ],
      finish: 'The listing is marked rented and its tenancy details are recorded.',
      linkLabel: 'Register, then choose Landlord',
      link: '/register',
    },
  ];

  readonly activeIndex = signal(0);
  readonly activeList = computed(() => [this.workflows[this.activeIndex()]]);

  selectRole(index: number): void {
    if (index === this.activeIndex()) return;
    this.activeIndex.set(index);
    setTimeout(() => {
      this.observeRevealElements();
      this.update();
    }, 30);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onScroll(): void {
    if (this.ticking || typeof window === 'undefined') return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.update();
    });
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.update();

    if (this.reducedMotion || !('IntersectionObserver' in window)) return;

    this.revealObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add('is-visible');
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    const page: HTMLElement = this.host.nativeElement;
    page.classList.add('has-scroll-reveal');
    this.observeRevealElements();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }

  private update(): void {
    const host: HTMLElement = this.host.nativeElement;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    host.style.setProperty('--progress', max > 0 ? String(Math.min(1, y / max)) : '0');
    host.style.setProperty('--py', this.reducedMotion ? '0' : String(Math.min(y, 900)));

    const journey = host.querySelector<HTMLElement>('.journey');
    if (!journey) return;

    const trigger = vh * 0.62;
    const rect = journey.getBoundingClientRect();
    const fill = this.reducedMotion
      ? 1
      : Math.max(0, Math.min(1, (trigger - rect.top) / rect.height));
    journey.style.setProperty('--fill', String(fill));

    journey.querySelectorAll<HTMLElement>('li').forEach((li) => {
      li.classList.toggle(
        'is-active',
        this.reducedMotion || li.getBoundingClientRect().top < trigger,
      );
    });
  }

  private observeRevealElements(): void {
    if (!this.revealObserver) return;
    const page: HTMLElement = this.host.nativeElement;
    page
      .querySelectorAll('.scroll-reveal:not(.is-visible)')
      .forEach((element) => this.revealObserver?.observe(element));
  }
}
