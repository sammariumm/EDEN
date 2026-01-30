
planButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateSelectedPlan(button);
    });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        updateSelectedPlan(button);
      }
    });
  });
  
  // Real-time validation for inputs
  function setupInputValidation(inputId, errorId, validationFn, errorMessage) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    
    input.addEventListener("blur", () => {
      if (!validationFn(input.value.trim())) {
        showError(errorId, errorMessage);
      } else {
        hideError(errorId);
      }
    });
    
    // For card number - format as user types
    if (inputId === "cardNumber") {
      input.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\s+/g, "");
        if (value.length > 0) {
          value = value.match(new RegExp(".{1,4}", "g")).join(" ");
        }
        e.target.value = value;
      });
    }
    
    // For expiry date - auto-insert slash
    if (inputId === "expiry") {
      input.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 2) {
          value = value.substring(0, 2) + "/" + value.substring(2, 4);
        }
        e.target.value = value;
      });
    }
  }
  
  // Setup validation for all fields
  setupInputValidation(
    "firstName",
    "firstNameError",
    (value) => value.length >= 2 && /^[A-Za-z ]+$/.test(value),
    "Please enter a valid first name (min 2 letters)."
  );
  
  setupInputValidation(
    "lastName",
    "lastNameError",
    (value) => value.length >= 2 && /^[A-Za-z ]+$/.test(value),
    "Please enter a valid last name (min 2 letters)."
  );
  
  setupInputValidation(
    "email",
    "emailError",
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Please enter a valid email address."
  );
  
  setupInputValidation(
    "cardName",
    "cardNameError",
    (value) => value.length >= 5 && /^[A-Za-z ]+$/.test(value),
    "Please enter the full name on your card."
  );
  
  setupInputValidation(
    "cardNumber",
    "cardNumberError",
    (value) => {
      const digits = value.replace(/\s+/g, "");
      return /^\d{13,19}$/.test(digits) && luhnCheck(digits);
    },
    "Please enter a valid card number."
  );

  setupInputValidation(
    "contact_number", 
    "contactNumberError", 
    validateContactNumber
);

function validateContactNumber(number) {
    // Check if the number is exactly 11 digits long and contains only numbers
    const regex = /^\d{11}$/;
    return regex.test(number);
}
  
  setupInputValidation(
    "expiry",
    "expiryError",
    (value) => {
      if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(value)) return false;
      
      const [month, year] = value.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      // Convert year to full year (20YY)
      const fullYear = 2000 + parseInt(year);
      
      // Check if expiry is in the future
      if (fullYear < new Date().getFullYear()) return false;
      if (fullYear === new Date().getFullYear() && parseInt(month) < currentMonth) return false;
      
      return true;
    },
    "Please enter a valid future expiry date."
  );
  
  setupInputValidation(
    "cvv",
    "cvvError",
    (value) => /^\d{3,4}$/.test(value),
    "Please enter a valid 3-4 digit CVV."
  );
  
  // Luhn algorithm for card validation
  function luhnCheck(cardNumber) {
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  }
  
  // Discount code apply
  const applyDiscountBtn = document.getElementById("applyDiscountBtn");
  const discountCodeInput = document.getElementById("discountCode");
  const discountError = document.getElementById("discountError");
  const discountSuccess = document.getElementById("discountSuccess");
  
  applyDiscountBtn.addEventListener("click", () => {
    const code = discountCodeInput.value.trim().toUpperCase();
    if (!code) {
      showError("discountError", "Please enter a discount code.");
      discountSuccess.classList.add("hidden");
      return;
    }
    
    if (discountCodes.hasOwnProperty(code)) {
      discountPercent = discountCodes[code];
      hideError("discountError");
      discountSuccess.textContent = `Discount applied! ${discountPercent}% off your purchase.`;
      discountSuccess.classList.remove("hidden");
      updateTotal();
    } else {
      showError("discountError", "Invalid discount code. Try WELCOME15 or SPECIAL20.");
      discountSuccess.classList.add("hidden");
      discountPercent = 0;
      updateTotal();
    }
  });
  
  // Form submission
  const paymentForm = document.getElementById("paymentForm");
  
  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
  
    // Validate first name
    const firstName = paymentForm.firstName.value.trim();
    if (!firstName || !/^[A-Za-z ]{2,}$/.test(firstName)) {
      showError("firstNameError", "Please enter a valid first name (min 2 letters).");
      valid = false;
    } else {
      hideError("firstNameError");
    }
  
    // Validate last name
    const lastName = paymentForm.lastName.value.trim();
    if (!lastName || !/^[A-Za-z ]{2,}$/.test(lastName)) {
      showError("lastNameError", "Please enter a valid last name (min 2 letters).");
      valid = false;
    } else {
      hideError("lastNameError");
    }
  
    // Validate email
    const email = paymentForm.email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      showError("emailError", "Please enter a valid email address.");
      valid = false;
    } else {
      hideError("emailError");
    }
  
    // Validate plan selected
    if (!selectedPlan) {
      showError("planError");
      valid = false;
    } else {
      hideError("planError");
    }
  
    // Validate payment method selected
    if (!selectedPaymentMethod) {
      showError("paymentMethodError");
      valid = false;
    } else {
      hideError("paymentMethodError");
    }
  
    // If payment method requires card details, validate them
    if (selectedPaymentMethod !== "googlepay" && selectedPaymentMethod !== "gcash") {
      // Validate card name
      const cardName = paymentForm.cardName.value.trim();
      if (!cardName || !/^[A-Za-z ]{5,}$/.test(cardName)) {
        showError("cardNameError", "Please enter the full name on your card.");
        valid = false;
      } else {
        hideError("cardNameError");
      }
  
      // Validate card number
      const cardNumber = paymentForm.cardNumber.value.replace(/\s+/g, "");
      if (!cardNumber || !/^\d{13,19}$/.test(cardNumber) || !luhnCheck(cardNumber)) {
        showError("cardNumberError", "Please enter a valid card number.");
        valid = false;
      } else {
        hideError("cardNumberError");
      }
  
      // Validate expiry date
      const expiry = paymentForm.expiry.value.trim();
      if (!expiry || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
        showError("expiryError", "Please enter a valid future expiry date (MM/YY).");
        valid = false;
      } else {
        const [month, year] = expiry.split("/");
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        const fullYear = 2000 + parseInt(year);
        
        if (fullYear < new Date().getFullYear() || 
            (fullYear === new Date().getFullYear() && parseInt(month) < currentMonth)) {
          showError("expiryError", "Please enter a valid future expiry date (MM/YY).");
          valid = false;
        } else {
          hideError("expiryError");
        }
      }
  
      // Validate CVV
      const cvv = paymentForm.cvv.value.trim();
      if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        showError("cvvError", "Please enter a valid 3-4 digit CVV.");
        valid = false;
      } else {
        hideError("cvvError");
      }
    }
  
    if (!valid) {
      const firstError = document.querySelector(".error-message:not(.hidden)");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        firstError.focus();
      }
      return;
    }
  
    const planText = Array.from(planButtons).find(btn => btn.getAttribute("data-plan") === selectedPlan).innerText;
    const finalPrice = (selectedPrice * (1 - discountPercent / 100)).toFixed(2);
  
    // Simulate payment processing
    if (selectedPaymentMethod === "googlepay") {
      alert(`Redirecting to Google Pay for payment of ${planText} (₱${finalPrice})`);
      window.open("https://pay.google.com/gp/w/u/0/home/paymentmethods", "_blank", "noopener");
      return;
    }
    if (selectedPaymentMethod === "gcash") {
      alert(`Redirecting to Gcash for payment of ${planText} (₱${finalPrice})`);
      window.open("https://www.gcash.com/payments", "_blank", "noopener");
      return;
    }
  
    const paymentMethodText = selectedPaymentMethod === "amex" ? "American Express" : 
                            selectedPaymentMethod === "debitcard" ? "Visa Debit Card" :
                            selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1);
  
    // Get the last 4 digits of the card number for display
    const cardNumber = paymentForm.cardNumber.value.replace(/\s+/g, "");
    const lastFourDigits = cardNumber.slice(-4);
  
    alert(
      `Thank you, ${firstName} ${lastName}!\n\n` +
      `You have successfully paid for:\n${planText}\n` +
      `Payment Method: ${paymentMethodText}\n` +
      `Card: **** **** **** ${lastFourDigits}\n` +
      `Total amount: ₱${finalPrice}\n\n` +
      `A confirmation email has been sent to ${email}.`
    );
  
    // Reset form (except for payment method)
    paymentForm.reset();
    planButtons.forEach(btn => {
      btn.classList.remove("selected");
      btn.setAttribute("aria-pressed", "false");
    });
    totalAmountSpan.textContent = "0.00";
    selectedPlan = null;
    selectedPrice = 0;
    discountPercent = 0;
    document.getElementById("discountCode").value = "";
    discountError.classList.add("hidden");
    discountSuccess.classList.add("hidden");
  
    // Keep payment method selected for convenience in prototype
    if (selectedPaymentMethod) {
      const currentMethodBtn = document.querySelector(`.payment-method-btn[data-method="${selectedPaymentMethod}"]`);
      if (currentMethodBtn) {
        currentMethodBtn.classList.add("selected");
        currentMethodBtn.setAttribute("aria-pressed", "true");
        currentMethodBtn.setAttribute("tabindex", "0");
      }
    }
  });
  
  document.getElementById('paymentForm').addEventListener('submit', function(event) {
    // Prevent form submission
    event.preventDefault();

    // Get the contact number input value
    const contactNumberInput = document.getElementById('contact_number');
    const contactNumber = contactNumberInput.value;
    const errorMessage = document.getElementById('contactNumberError');

    // Validate the contact number
    if (!validateContactNumber(contactNumber)) {
        // Show error message
        errorMessage.classList.remove('hidden');
    } else {
        // Hide error message
        errorMessage.classList.add('hidden');
        
        // If valid, you can proceed with form submission
        // For example, you can submit the form here
        // this.submit(); // Uncomment this line to submit the form
    }
});

function validateContactNumber(number) {
    // Check if the number is exactly 11 digits long and contains only numbers
    const regex = /^\d{11}$/;
    return regex.test(number);
}
