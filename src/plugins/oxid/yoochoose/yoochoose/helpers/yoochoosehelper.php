<?php

class Yoochoosehelper extends oxUBase
{
    const YC_MAX_FILE_SIZE = 52428800; // max file size size in bytes 50Mb

    const YC_DIRECTORY_NAME = 'yoochoose';
    /**
     * export to files
     *
     * @param int $limit
     * @param array $shopData
     * @param int $transaction
     * @param int $mandatorId
     * @return array postData
     */
    public function export($shopData, $transaction, $limit, $mandatorId)
    {
        $conf = oxNew('oxConfig');
        $shopIds = array();
        $formatsMap = array(
            'OXID2' => 'Products',
            'OXID2_CATEGORIES' => 'Categories',
            'OXID2_VENDORS' => 'Vendors',
        );

        $postData = array(
            'transaction' => $transaction,
            'events' => array(),
        );

        foreach ($formatsMap as $format => $method) {
            if (!empty($shopData)) {
                foreach ($shopData as $shop) {
                    $postData['events'][] = array(
                        'action' => 'FULL',
                        'format' => $format,
                        'contentTypeId' => $conf->getShopConfVar('ycItemType', $shop['shopId']),
                        'shopViewId' => $shop['shopId'],
                        'lang' => $shop['language'],
                        'credentials' => [
                            'login' => null,
                            'password' => null,
                        ],
                        'uri' => array(),
                    );
                    $shopIds [$method][] = $shop['shopId'];

                }
            }
        }
        $file = oxNew('oxUtilsFile');
        $basePath =  getShopBasePath();
        $basePath = str_replace('\\', '/', $basePath);
        $directory = $basePath . 'out/' . self::YC_DIRECTORY_NAME . '/' . $mandatorId . '/';
        $file->deleteDir($directory);
        mkdir($directory, 0775, true);
        $i = 0;

        foreach ($postData['events'] as $event) {
            $method = $formatsMap[$event['format']] ? $formatsMap[$event['format']] : null;
            if ($method) {
                $postData = $this->exportData($method, $postData, $directory, $limit, $i, $event['shopViewId'], $mandatorId, $event['lang']);
            }

            $i++;
        }

        return $postData;
    }

    /**
     * Generates random string with $length characters
     *
     * @param int $length
     * @return string
     */
    private function generateRandomString($length = 20)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }

        return $randomString;
    }

    /**
     * Exports data to file and returns $postData parameter
     *   with URLs to files
     *
     * @param string $entity
     * @param array $postData
     * @param string $directory
     * @param integer $limit
     * @param integer $exportIndex
     * @param integer $shopId
     * @param string $mandatorId
     * @param $lang
     * @return array $postData
     */
    private function exportData($entity, $postData, $directory, $limit = 0, $exportIndex = 0, $shopId, $mandatorId, $lang)
    {

        /* @var Ycexportmodel $model */
        $model = oxNew('ycexportmodel');
        /** @var oxViewConfig $oxViewConfig */
        $oxViewConfig = oxNew('oxViewConfig');
        $baseUrl = $oxViewConfig->getBaseDir();
        $fileUrl = $baseUrl . 'out/' . self::YC_DIRECTORY_NAME . '/' . $mandatorId . '/';

        $method = 'get' . $entity;
        $offset = 0;
        $logNames = '';

        $logger = oxNew('yoochoosemodel');
        do {
            $logger->log('Exporting ' . $entity, $shopId, "offset: $offset, limit: $limit", $lang);

            $results = $model->$method($shopId, $offset, $limit, $lang);
            if (!empty($results)) {
                $filename = $this->generateRandomString() . '.json';
                $file = $directory . $filename;
                file_put_contents($file, json_encode(array_values($results)));
                $fileSize = filesize($file);
                if ($fileSize >= self::YC_MAX_FILE_SIZE) {
                    unlink($file);
                    $limit = (int)($limit / 2);

                    $logger->log('Reducing limit size because of max file size.', $fileSize,
                        "offset: $offset, limit: $limit", self::YC_MAX_FILE_SIZE);
                } else {
                    $postData['events'][$exportIndex]['uri'][] = $fileUrl . $filename;
                    $offset = $offset + $limit;
                    $logNames .= $filename . ', ';
                }
            }
        } while(!empty($results));

        $logNames = $logNames ?: 'there are no files';
        $logger->log('Export has finished for ' . $entity . ' with file names : ' . $logNames);

        return $postData;
    }
}