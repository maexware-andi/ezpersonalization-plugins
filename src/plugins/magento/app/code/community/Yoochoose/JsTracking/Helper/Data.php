<?php

class Yoochoose_JsTracking_Helper_Data extends Mage_Core_Helper_Abstract
{

    public function _getHttpPage($url, $body, $customerId, $licenceKey)
    {
        $bodyString = json_encode($body);
        $options = array(
            CURLOPT_URL => $url,
            CURLOPT_HEADER => 0,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_RETURNTRANSFER => TRUE,
//            CURLOPT_FOLLOWLOCATION => TRUE, DO NOT ENABLE ME. CURL has problems with this flag and it is useles here. POST request cannot be followed.
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
            CURLOPT_USERPWD => "$customerId:$licenceKey",
            CURLOPT_SSL_VERIFYPEER => FALSE,
            CURLINFO_HEADER_OUT  => TRUE,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($bodyString),
            ),
            CURLOPT_POSTFIELDS => $bodyString
        );

        $cURL = curl_init();
        curl_setopt_array($cURL, $options);

        Mage::log("Requesting ".$url."...", Zend_Log::INFO, 'yoochoose.log');

        $response = curl_exec($cURL);

        Mage::log("Request headers dump:\n ".curl_getinfo($cURL, CURLINFO_HEADER_OUT), Zend_Log::DEBUG, 'yoochoose.log');

        Mage::log("Response body:\n ".$response, Zend_Log::DEBUG, 'yoochoose.log');

        $result = json_decode($response, true);

        $eno = curl_errno($cURL);
        if ($eno && $eno != 22) {
            $msg = 'I/O error requesting [' . $url . ']. Code: ' . $eno . ". " . curl_error($cURL);
            throw new Exception($msg);
        }

        $status = curl_getinfo($cURL, CURLINFO_HTTP_CODE);
        switch ($status) {
            case 200: 
                break;
            case 409:
                if ($result['faultCode'] === 'pluginAlreadyExistsFault') {
                    break;
                }
            default:
                $msg = $result['faultMessage'] . ' With status code: ' . $status;
                throw new Exception($msg);
        }

        curl_close($cURL);

        return $result;
    }

    public function getModuleVersion()
    {
        return (string) Mage::getConfig()->getNode()->modules->Yoochoose_JsTracking->version;
    }
}
