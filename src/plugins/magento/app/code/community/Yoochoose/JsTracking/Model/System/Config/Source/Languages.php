<?php

class Yoochoose_JsTracking_Model_System_Config_Source_Languages
{

    /**
     * Options getter
     *
     * @return array
     */
    public function toOptionArray()
    {
        return Mage::app()->getLocale()->getOptionLocales();
    }

    public function useCountryCode()
    {
        return array(
            '0' => 'Do not use country code (e.g. "en")',
            '1' => 'Use country code (e.g. "en_US")',
        );
    }
}