import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyStatus } from '../../../core/models/property.model';
import { MyPropertiesComponent } from './my-properties.component';

describe('MyPropertiesComponent', () => {
  const mockProperties = [
    {
      id: 'prop-1',
      title: 'Bole Apartment',
      city: 'Addis Ababa',
      subCity: 'Bole',
      neighborhood: 'Medhanealem',
      status: PropertyStatus.Published,
      rentAmountETB: 50000,
      bedrooms: 2,
      bathrooms: 1,
      advanceMonthsRequired: 3,
      furnishing: 1
    },
    {
      id: 'prop-2',
      title: 'CMC Condominium',
      city: 'Addis Ababa',
      subCity: 'Yeka',
      neighborhood: 'CMC',
      status: PropertyStatus.Rented,
      rentAmountETB: 25000,
      bedrooms: 2,
      bathrooms: 1,
      advanceMonthsRequired: 3,
      furnishing: 0
    }
  ];

  it('loads landlord listings and displays them', () => {
    const getMyProperties = vi.fn().mockReturnValue(of({ succeeded: true, data: mockProperties, errors: [] }));

    TestBed.configureTestingModule({
      imports: [MyPropertiesComponent],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: { getMyProperties } }
      ]
    });

    const fixture = TestBed.createComponent(MyPropertiesComponent);
    fixture.detectChanges();

    expect(getMyProperties).toHaveBeenCalled();
    expect(fixture.componentInstance.properties.length).toBe(2);
    expect(fixture.componentInstance.isLoading).toBe(false);
  });

  it('marks a property as rented with tenant tenancy info', () => {
    const getMyProperties = vi.fn().mockReturnValue(of({ succeeded: true, data: mockProperties, errors: [] }));
    const markAsRented = vi.fn().mockReturnValue(of({ succeeded: true, data: { status: 6 }, errors: [] }));

    TestBed.configureTestingModule({
      imports: [MyPropertiesComponent],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: { getMyProperties, markAsRented } }
      ]
    });

    const fixture = TestBed.createComponent(MyPropertiesComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.openRentedModal(mockProperties[0] as any);
    expect(comp.selectedPropForRented).toBeDefined();

    comp.rentedTenantName = 'Abebe Kebede';
    comp.rentedAmountETB = 52000;
    comp.rentedLeaseMonths = 12;
    comp.rentedStartDate = '2026-11-01';

    comp.confirmMarkAsRented();

    expect(markAsRented).toHaveBeenCalledWith('prop-1', expect.objectContaining({
      tenantName: 'Abebe Kebede',
      agreedRentAmountETB: 52000,
      agreedLeaseMonths: 12
    }));
  });
});
