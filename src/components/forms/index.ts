// Side-effect imports: each module registers its form(s) into the FormRegistry.
import './VanillaIrsForm';
import './NdirsForm';
import './OisForm';
import './XccyForm';
import './NdXccyForm';
import './MmDepositForm';
import './MmLoanForm';
import './FraForm';
import './SwaptionForm';
import './CapFloorForm';
import './StructuredIrsForm';

export { allProductForms, getProductForm } from './FormRegistry';
